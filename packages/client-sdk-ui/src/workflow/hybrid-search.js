import { trimObj, API } from '@miso.ai/commons';
import AnswerBasedWorkflow from './answer-based.js';
import { ROLE, ORGANIC_QUESTION_SOURCE } from '../constants.js';
import { ListLayout, TextLayout } from '../layout/index.js';
import { writeKeywordsToData, addDataInstructions } from './processors.js';

const DEFAULT_API_OPTIONS = Object.freeze({
  ...AnswerBasedWorkflow.DEFAULT_API_OPTIONS,
  name: API.NAME.SEARCH,
  payload: {
    ...AnswerBasedWorkflow.DEFAULT_API_OPTIONS.payload,
  },
});

const DEFAULT_LAYOUTS = Object.freeze({
  ...AnswerBasedWorkflow.DEFAULT_LAYOUTS,
  [ROLE.PRODUCTS]: [ListLayout.type, { itemType: 'article' }],
  [ROLE.KEYWORDS]: [TextLayout.type, { raw: true }],
  [ROLE.HITS]: [TextLayout.type, { raw: true, format: 'number' }],
});

const DEFAULT_TRACKERS = Object.freeze({
  ...AnswerBasedWorkflow.DEFAULT_TRACKERS,
});

const DEFAULT_OPTIONS = Object.freeze({
  ...AnswerBasedWorkflow.DEFAULT_OPTIONS,
  api: DEFAULT_API_OPTIONS,
  layouts: DEFAULT_LAYOUTS,
  trackers: DEFAULT_TRACKERS,
});

const SEARCH_RESULTS_ROLES = [ROLE.PRODUCTS, ROLE.KEYWORDS, ROLE.HITS, ROLE.QUESTION]; // show question as well

export default class HybridSearch extends AnswerBasedWorkflow {

  constructor(plugin, client) {
    super({
      name: 'hybrid-search',
      plugin,
      client,
      roles: Object.keys(DEFAULT_LAYOUTS),
      defaults: DEFAULT_OPTIONS,
    });

    this._initProperties();
    this._initActors();
    this._initSubscriptions();

    this.reset();
  }

  _initActors() {
    super._initActors();
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

  refine() {
    // TODO
  }

  // data //
  _handleResponseObject(data) {
    // write search results from initial POST API response
    data = trimObj({ ...data, value: data.value.response });
    this.updateData(data);
  }

  _defaultProcessData(data) {
    data = super._defaultProcessData(data);
    data = writeKeywordsToData(data, { question: true });
    data = instructPartialUpdates(data);
    return data;
  }

}

function instructPartialUpdates(data) {
  if (!data.value) {
    return data;
  }
  return addDataInstructions(data, data.value.products ? { includes: SEARCH_RESULTS_ROLES, merge: true } : { excludes: SEARCH_RESULTS_ROLES, merge: true });
}
