import { mergeApiPayloads } from '@miso.ai/commons';
import SearchBasedWorkflow from './search-based.js';
import { STATUS, REQUEST_TYPE } from '../constants.js';
import { writeMisoIdToSession, writeQuestionSourceToPayload, disableAnswerForNonQueryRequest } from './processors.js';
import { makeAutocompletable } from './autocompletable.js';

// we want to override members, not adding to it
const ROLES_OPTIONS = SearchBasedWorkflow.ROLES_OPTIONS;

const EXTRA_OPTIONS = Object.freeze({
  api: Object.freeze({
    polling: false,
  }),
});

export default class HybridSearchResults extends SearchBasedWorkflow {

  constructor(superworkflow) {
    super({
      name: 'hybrid-search/results',
      plugin: superworkflow._plugin,
      client: superworkflow._client,
      options: superworkflow._options,
      defaults: superworkflow._defaults,
      extraOptions: EXTRA_OPTIONS,
      roles: ROLES_OPTIONS,
      superworkflow,
    });
  }

  _initProperties(args) {
    super._initProperties(args);
    this._initAutocomplete(args);
    this._superworkflow = args.superworkflow;
  }

  _initSession() {} // no reset here, will manually reset later

  restart({ type } = {}) {
    super.restart();
    if (type === REQUEST_TYPE.QUERY) {
      this._superworkflow._answer.restart();
    }
  }

  // lifecycle //
  _emitLifecycleEvent(name, event) {
    super._emitLifecycleEvent(name, event);
    this._superworkflow._emitLifecycleEvent(name, event);
  }

  // query //
  _buildPayload(payload, type) {
    payload = super._buildPayload(payload, type);
    // borrow the work from the sibling
    payload = disableAnswerForNonQueryRequest(payload, type);
    payload = writeQuestionSourceToPayload(payload);
    payload = this._writeQuestionIdToPayload(payload, type);
    if (payload.answer !== false) {
      payload = this._superworkflow._answer._writeWikiLinkTemplateToPayload(payload);
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
    const question_id = this._superworkflow._answer.questionId;
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

  _updateDataInHub(data) {
    this._dispatchDataToAnswerWorkflow(data);
    super._updateDataInHub(data);
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
        this._superworkflow._answer._doLoading(data);
        break;
      case STATUS.READY:
        // start a query with retrieved question ID, if any
        this._superworkflow._answer._queryWithQuestionId(data);
        break;
    }
  }

  // interactions //
  _defaultProcessInteraction(payload, args) {
    return this._superworkflow._defaultProcessInteraction(payload, args);
  }

  _defaultProcessInteraction0(payload, args) {
    return super._defaultProcessInteraction(payload, args);
  }

  // destroy //
  _destroy(options) {
    this._destroyAutocomplete();
    super._destroy(options);
  }

}

makeAutocompletable(HybridSearchResults.prototype);

Object.assign(HybridSearchResults, {
  ROLES_OPTIONS,
});
