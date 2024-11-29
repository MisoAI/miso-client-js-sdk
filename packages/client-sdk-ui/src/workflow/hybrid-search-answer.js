import AnswerBasedWorkflow from './answer-based.js';
import { ROLE, STATUS, ORGANIC_QUESTION_SOURCE } from '../constants.js';
import { writeKeywordsToData } from './processors.js';

const ROLES_CONFIG = Object.freeze({
  [ROLE.QUESTION]: {
    mapping: ROLE.KEYWORDS,
  },
});

export default class HybridSearchAnswer extends AnswerBasedWorkflow {

  constructor(superworkflow) {
    super({
      name: 'hybrid-search/answer',
      plugin: superworkflow._plugin,
      client: superworkflow._client,
      options: superworkflow._options,
      roles: Object.keys(AnswerBasedWorkflow.DEFAULT_LAYOUTS),
      rolesConfig: ROLES_CONFIG,
      superworkflow,
    });
  }

  _initProperties(args) {
    super._initProperties(args);
    this._superworkflow = args.superworkflow;
  }

  _initReset() {} // no reset here, will manually reset later

  restart() {
    super.restart();
    // cascade restart to the sibling
    const results = this._superworkflow._results;
    results.restart();
    this._resultsSession = results.session; // keep track of the session
  }

  // query //
  _buildPayload({ q, qs, ...payload } = {}) {
    return {
      ...payload,
      q, // q, not question
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

}
