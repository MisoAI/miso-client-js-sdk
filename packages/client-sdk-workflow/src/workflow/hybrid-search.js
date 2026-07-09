import SearchBasedWorkflow from './search-based.js';
import AnswerBasedWorkflow from './answer-based.js';
import { ROLE, WORKFLOW_CONFIGURABLE } from '../constants.js';
import HybridSearchAnswer from './hybrid-search-answer.js';
import HybridSearchViewsActor from './hybrid-search-views.js';
import { mergeRolesOptions, makeConfigurable } from './options/index.js';

import { mergeApiPayloads } from '@miso.ai/commons';
import { STATUS, REQUEST_TYPE } from '../constants.js';
import { writeMisoIdToSession, writeQuestionSourceToPayload, disableAnswerForNonQueryRequest, carryOverQuestionIdToData, writeAnswerInfoToInteraction } from './processors.js';
import { makeAutocompletable } from './autocompletable.js';

const ROLES_OPTIONS = mergeRolesOptions(AnswerBasedWorkflow.ROLES_OPTIONS, SearchBasedWorkflow.ROLES_OPTIONS, {
  main: ROLE.PRODUCTS,
});

const EXTRA_OPTIONS = Object.freeze({
  api: Object.freeze({
    polling: false,
  }),
});

export default class HybridSearch extends SearchBasedWorkflow {

  constructor(plugin, client) {
    super({
      name: 'hybrid-search',
      plugin,
      client,
      roles: ROLES_OPTIONS,
      extraOptions: EXTRA_OPTIONS,
    });
  }

  _initProperties(args) {
    super._initProperties(args);
    this._initAutocomplete(args);
    this._answer = new HybridSearchAnswer(this);
  }

  _initActors(args) {
    super._initActors(args);
    this._views = new HybridSearchViewsActor({
      results: this._views,
      answer: this._answer._views,
    });
  }

  restart({ type } = {}) {
    super.restart();
    if (!type || type === REQUEST_TYPE.QUERY) {
      this._answer.restart();
    }
  }

  // properties //
  get answer() {
    return this._answer;
  }

  get questionId() {
    return this._answer.questionId;
  }

  // query //
  _buildPayload(payload, type) {
    payload = super._buildPayload(payload, type);
    // borrow the work from the sibling
    payload = disableAnswerForNonQueryRequest(payload, type);
    payload = writeQuestionSourceToPayload(payload);
    payload = this._writeQuestionIdToPayload(payload, type);
    if (payload.answer !== false) {
      // uses autoQuery params, so we want to apply to this workflow
      payload = AnswerBasedWorkflow.prototype._writeWikiLinkTemplateToPayload.call(this, payload);
    }
    return payload;
  }

  _buildOrderBy(sort) {
    if (!sort) {
      return undefined;
    }
    // works differently than search
    return sort.field;
  }

  _writeQuestionIdToPayload(payload, type) {
    if (type === REQUEST_TYPE.QUERY) {
      return payload;
    }
    const question_id = this._answer.questionId;
    if (!question_id) {
      return payload;
    }
    return mergeApiPayloads(payload, {
      metadata: {
        question_id,
      },
    });
  }

  // data //
  _defaultProcessData(data, oldData) {
    data = super._defaultProcessData(data, oldData);
    writeMisoIdToSession(data);
    return data;
  }

  _updateDataInHub(data, oldData) {
    this._dispatchDataToAnswerWorkflow(data);
    data = carryOverQuestionIdToData(data, oldData); // TODO: may as well move to process data
    super._updateDataInHub(data, oldData);
  }

  _dispatchDataToAnswerWorkflow(data) {
    const { request } = data;
    if (!request) {
      return;
    }
    const { type, payload } = request;
    if (type !== REQUEST_TYPE.QUERY || !payload || payload.answer === false) {
      return;
    }
    switch (data.status) {
      case STATUS.LOADING:
        // share the loading status with its sibling
        this._answer._doLoading(data);
        break;
      case STATUS.READY:
        // start a query with retrieved question ID, if any
        this._answer._queryWithQuestionId(data);
        break;
    }
  }

  // interactions //
  _defaultProcessInteraction(payload, args) {
    payload = super._defaultProcessInteraction(payload, args);
    payload = writeAnswerInfoToInteraction(payload, args);
    return payload;
  }

  // destroy //
  _destroy() {
    this._answer.destroy();
    super._destroy();
  }

}

makeConfigurable(HybridSearch.prototype, [WORKFLOW_CONFIGURABLE.PAGINATION, WORKFLOW_CONFIGURABLE.FILTERS]);
makeAutocompletable(HybridSearch.prototype);
