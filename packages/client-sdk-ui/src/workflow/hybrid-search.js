import { API } from '@miso.ai/commons';
import { InteractionsActor } from '../actor/index.js';
import Workflow from './base.js';
import SearchBasedWorkflow from './search-based.js';
import AnswerBasedWorkflow from './answer-based.js';
import { ROLE, WORKFLOW_CONFIGURABLE } from '../constants.js';
import { SearchBoxLayout, TextLayout } from '../layout/index.js';
import HybridSearchAnswer from './hybrid-search-answer.js';
import HybridSearchResults from './hybrid-search-results.js';
import HybridSearchViewsActor from './hybrid-search-views.js';
import { makeConfigurable } from './options/index.js';

const DEFAULT_API_OPTIONS = Object.freeze({
  group: API.GROUP.ASK,
  name: API.NAME.SEARCH,
  payload: {
    ...AnswerBasedWorkflow.DEFAULT_API_OPTIONS.payload,
    ...SearchBasedWorkflow.DEFAULT_API_OPTIONS.payload,
    source_fl: ['cover_image', 'url', 'created_at', 'updated_at', 'published_at', 'title'],
  },
});

const DEFAULT_LAYOUTS = Object.freeze({
  ...AnswerBasedWorkflow.DEFAULT_LAYOUTS,
  ...SearchBasedWorkflow.DEFAULT_LAYOUTS,
  [ROLE.QUERY]: [SearchBoxLayout.type, { placeholder: '' }],
  [ROLE.QUESTION]: [TextLayout.type, { raw: true }],
});

const DEFAULT_TRACKERS = Object.freeze({
  ...AnswerBasedWorkflow.DEFAULT_TRACKERS,
  ...SearchBasedWorkflow.DEFAULT_TRACKERS,
});

const DEFAULT_PAGINATION = Object.freeze({
  ...SearchBasedWorkflow.DEFAULT_PAGINATION,
  active: true,
});

const DEFAULT_AUTOCOMPLETE_OPTIONS = Object.freeze({
  api: {
    group: API.GROUP.ASK,
    name: API.NAME.SEARCH_AUTOCOMPLETE,
    payload: {
      completion_fields: ['suggested_queries'],
    },
  },
});

const DEFAULT_OPTIONS = Object.freeze({
  ...AnswerBasedWorkflow.DEFAULT_OPTIONS,
  ...SearchBasedWorkflow.DEFAULT_OPTIONS,
  api: DEFAULT_API_OPTIONS,
  layouts: DEFAULT_LAYOUTS,
  trackers: DEFAULT_TRACKERS,
  autocomplete: DEFAULT_AUTOCOMPLETE_OPTIONS,
  pagination: DEFAULT_PAGINATION,
});

const ROLES_OPTIONS = Object.freeze({
  main: ROLE.PRODUCTS,
  members: Object.keys(DEFAULT_LAYOUTS),
  mappings: Object.freeze({
    ...AnswerBasedWorkflow.ROLES_OPTIONS.mappings,
    ...SearchBasedWorkflow.ROLES_OPTIONS.mappings,
  }),
});

export default class HybridSearch extends Workflow {

  constructor(plugin, client) {
    super({
      name: 'hybrid-search',
      plugin,
      client,
      roles: ROLES_OPTIONS,
      defaults: DEFAULT_OPTIONS,
    });
  }

  _initProperties(args) {
    super._initProperties(args);
    this._subworkflows = [
      this._answer = new HybridSearchAnswer(this),
      this._results = new HybridSearchResults(this),
    ];
  }

  _getSubworkflow(name) {
    switch (name) {
      case 'answer':
        return this._answer;
      case 'results':
        return this._results;
      default:
        throw new Error(`Invalid subworkflow: ${name}`);
    }
  }

  _initActors() {
    this._views = new HybridSearchViewsActor(this);
  }

  _initSession() {
    this._results._sessions.restart();
    this._answer._sessions.restart();
  }

  // configuration //
  useLink(fn, options) {
    this._answer.useLink(fn, options);
    return this;
  }

  // properties //
  get answer() {
    return this._answer;
  }

  get results() {
    return this._results;
  }

  get questionId() {
    return this._answer.questionId;
  }

  get filters() {
    return this._results._views.filters;
  }

  get autocomplete() {
    return this._answer.autocomplete;
  }

  // query //
  autoQuery(options) {
    this._answer.autoQuery(options);
  }

  query(args) {
    this._answer.query(args);
  }

  // interactions //
  _defaultProcessInteraction(payload, args) {
    payload = this._answer._defaultProcessInteraction0(payload, args);
    payload = this._results._defaultProcessInteraction0(payload, args);
    return payload;
  }

  // destroy //
  _destroy() {
    for (const subworkflow of this._subworkflows) {
      subworkflow.destroy();
    }
    super._destroy();
  }

}

makeConfigurable(HybridSearch.prototype, [WORKFLOW_CONFIGURABLE.PAGINATION, WORKFLOW_CONFIGURABLE.FILTERS]);
