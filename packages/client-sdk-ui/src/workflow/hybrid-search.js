import { API } from '@miso.ai/commons';
import SearchBasedWorkflow from './search-based.js';
import AnswerBasedWorkflow from './answer-based.js';
import { ROLE, WORKFLOW_CONFIGURABLE } from '../constants.js';
import { SearchBoxLayout, TextLayout, HorizontalLayout } from '../layout/index.js';
import { compactArticle, compactArticleInfoBlock } from '../layout/templates.js';
import HybridSearchAnswer from './hybrid-search-answer.js';
import HybridSearchViewsActor from './hybrid-search-views.js';
import { makeConfigurable } from './options/index.js';

import { mergeApiPayloads } from '@miso.ai/commons';
import { STATUS, REQUEST_TYPE } from '../constants.js';
import { writeMisoIdToSession, writeQuestionSourceToPayload, disableAnswerForNonQueryRequest, carryOverQuestionIdToData, writeAnswerInfoToInteraction } from './processors.js';
import { makeAutocompletable } from './autocompletable.js';

const DEFAULT_API_OPTIONS = Object.freeze({
  group: API.GROUP.ASK,
  name: API.NAME.SEARCH,
  payload: {
    ...AnswerBasedWorkflow.DEFAULT_API_OPTIONS.payload,
    ...SearchBasedWorkflow.DEFAULT_API_OPTIONS.payload,
    source_fl: ['cover_image', 'url', 'created_at', 'updated_at', 'published_at', 'title', 'authors'],
  },
});

const DEFAULT_LAYOUTS = Object.freeze({
  ...AnswerBasedWorkflow.DEFAULT_LAYOUTS,
  ...SearchBasedWorkflow.DEFAULT_LAYOUTS,
  [ROLE.QUERY]: [SearchBoxLayout.type, { placeholder: '' }],
  [ROLE.QUESTION]: [TextLayout.type, { raw: true }],
  [ROLE.SOURCES]: [
    HorizontalLayout.type,
    {
      incremental: true,
      itemType: 'article',
      templates: {
        ordered: true,
        article: compactArticle,
        articleInfoBlock: compactArticleInfoBlock
      }
    }
  ],
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

const DEFAULT_FILTERS_OPTIONS = Object.freeze({
  sort: {
    options: [
      { field: 'relevance', text: 'Relevance', default: true },
      { field: 'published_at', text: 'Date' },
    ],
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
  filters: DEFAULT_FILTERS_OPTIONS,
});

const ROLES_OPTIONS = Object.freeze({
  main: ROLE.PRODUCTS,
  members: Object.keys(DEFAULT_LAYOUTS),
  mappings: Object.freeze({
    ...AnswerBasedWorkflow.ROLES_OPTIONS.mappings,
    ...SearchBasedWorkflow.ROLES_OPTIONS.mappings,
  }),
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
      defaults: DEFAULT_OPTIONS,
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
