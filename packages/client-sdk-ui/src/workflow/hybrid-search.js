import { API } from '@miso.ai/commons';
import { InteractionsActor } from '../actor/index.js';
import Workflow from './base.js';
import AnswerBasedWorkflow from './answer-based.js';
import { ROLE } from '../constants.js';
import { SearchBoxLayout, ListLayout, TextLayout, FacetsLayout, MoreButtonLayout } from '../layout/index.js';
import HybridSearchAnswer from './hybrid-search-answer.js';
import HybridSearchResults from './hybrid-search-results.js';
import HybridSearchViewsActor from './hybrid-search-views.js';

const DEFAULT_ROWS = 10;

const DEFAULT_API_OPTIONS = Object.freeze({
  ...AnswerBasedWorkflow.DEFAULT_API_OPTIONS,
  name: API.NAME.SEARCH,
  payload: {
    ...AnswerBasedWorkflow.DEFAULT_API_OPTIONS.payload,
    source_fl: ['cover_image', 'url', 'created_at', 'updated_at', 'published_at', 'title'],
    fl: ['cover_image', 'url', 'created_at', 'updated_at', 'published_at', 'title'],
    rows: DEFAULT_ROWS,
  },
});

const DEFAULT_LAYOUTS = Object.freeze({
  ...AnswerBasedWorkflow.DEFAULT_LAYOUTS,
  [ROLE.QUERY]: [SearchBoxLayout.type, { placeholder: '' }],
  [ROLE.QUESTION]: [TextLayout.type, { raw: true }],
  [ROLE.PRODUCTS]: [ListLayout.type, { incremental: true, itemType: 'article', infiniteScroll: true }],
  [ROLE.KEYWORDS]: [TextLayout.type, { raw: true }],
  [ROLE.HITS]: [TextLayout.type, { raw: true, format: 'number' }],
  [ROLE.FACETS]: [FacetsLayout.type],
  [ROLE.MORE]: [MoreButtonLayout.type],
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

export default class HybridSearch extends Workflow {

  constructor(plugin, client) {
    super({
      name: 'hybrid-search',
      plugin,
      client,
      roles: Object.keys(DEFAULT_LAYOUTS),
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
    const hub = this._hub;
    const client = this._client;
    const options = this._options;

    this._views = new HybridSearchViewsActor(this);
    this._interactions = new InteractionsActor(hub, { client, options });
  }

  _initSession() {
    this._results._sessions.restart();
    this._answer._sessions.restart();
  }

  // properties //
  get questionId() {
    return this._answer.questionId;
  }

  get filters() {
    return this._results._views.filters;
  }

  // query //
  autoQuery(options) {
    this._answer.autoQuery(options);
  }

  query(args) {
    this._answer.query(args);
  }

  // interactions //
  _preprocessInteraction(payload) {
    return this._answer._preprocessInteraction(payload);
  }

  // destroy //
  _destroy() {
    for (const subworkflow of this._subworkflows) {
      subworkflow.destroy();
    }
    super._destroy();
  }

}
