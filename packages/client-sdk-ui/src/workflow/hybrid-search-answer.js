import AnswerBasedWorkflow from './answer-based.js';
import { ROLE, STATUS, ORGANIC_QUESTION_SOURCE } from '../constants.js';
import { mergeRolesOptions } from './options/index.js';
import { writeKeywordsToData } from './processors.js';
import { makeAutocompletable } from './autocompletable.js';

const ROLES_OPTIONS = mergeRolesOptions(AnswerBasedWorkflow.ROLES_OPTIONS, {
  mappings: {
    [ROLE.QUESTION]: ROLE.KEYWORDS,
  },
});

export default class HybridSearchAnswer extends AnswerBasedWorkflow {

  constructor(superworkflow) {
    super({
      name: 'hybrid-search/answer',
      plugin: superworkflow._plugin,
      client: superworkflow._client,
      options: superworkflow._options,
      defaults: superworkflow._defaults,
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

  restart() {
    super.restart();
    // cascade restart to the sibling
    const results = this._superworkflow._results;
    results._views.filters.reset();
    results.restart();
    this._resultsSession = results.session; // keep track of the session
  }

  // query //
  _buildPayload(payload) {
    payload = this._writeQuestionSourceToPayload(payload);
    payload = this._writeWikiLinkTemplateToPayload(payload);
    payload = this._superworkflow._results._writeFiltersToPayload(payload);
    return payload;
  }

  _writeQuestionSourceToPayload({ qs, ...payload } = {}) {
    return {
      ...payload,
      _meta: {
        ...payload._meta,
        question_source: qs || ORGANIC_QUESTION_SOURCE, // might be null, not undefined
      },
    };
  }

  // data //
  _defaultProcessData(data) {
    data = super._defaultProcessData(data);
    data = writeKeywordsToData(data);
    return data;
  }

  _updateDataInHub(data) {
    switch (data.status) {
      case STATUS.INITIAL:
      case STATUS.LOADING:
        // share the initial/loading status with its sibling
        this._dispatchDataToSibling(data);
        break;
    }
    super._updateDataInHub(data);
  }

  _handleHeadResponse(data) {
    super._handleHeadResponse(data);
    // share the search results with its sibling
    this._dispatchDataToSibling(data);
  }

  _dispatchDataToSibling(data) {
    this._resultsSession && this._superworkflow._results.updateData({ ...data, session: this._resultsSession });
  }

  // destroy //
  _destroy(options) {
    this._destroyAutocomplete();
    super._destroy(options);
  }

}

makeAutocompletable(HybridSearchAnswer.prototype);
