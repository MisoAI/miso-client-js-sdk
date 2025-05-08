import { API, asArray, trimObj } from '@miso.ai/commons';
import Workflow from './base.js';
import { fields } from '../actor/index.js';
import { STATUS, ROLE, WORKFLOW_CONFIGURABLE } from '../constants.js';
import { SearchBoxLayout, ListLayout, TextLayout, FacetsLayout, SelectLayout, MoreButtonLayout } from '../layout/index.js';
import { mappingSortData, writeKeywordsToData, retainFacetCountsInData, writeExhaustionToData, concatItemsFromMoreResponse } from './processors.js';
import { mergeRolesOptions, autoQuery as autoQueryFn, makeConfigurable, DEFAULT_TRACKER_OPTIONS } from './options/index.js';

const DEFAULT_ROWS = 10;
const DEFAULT_PAGE_LIMIT = 10;

const DEFAULT_API_OPTIONS = Object.freeze({
  ...Workflow.DEFAULT_API_OPTIONS,
  group: API.GROUP.SEARCH,
  payload: {
    ...Workflow.DEFAULT_API_OPTIONS.payload,
    fl: ['cover_image', 'url', 'created_at', 'updated_at', 'published_at', 'title'],
    rows: DEFAULT_ROWS,
  },
});

const DEFAULT_LAYOUTS = Object.freeze({
  ...Workflow.DEFAULT_LAYOUTS,
  [ROLE.QUERY]: [SearchBoxLayout.type],
  [ROLE.PRODUCTS]: [ListLayout.type, { incremental: true, infiniteScroll: true }],
  [ROLE.KEYWORDS]: [TextLayout.type, { raw: true }],
  [ROLE.TOTAL]: [TextLayout.type, { raw: true, format: 'number' }],
  [ROLE.FACETS]: [FacetsLayout.type],
  [ROLE.SORT]: [SelectLayout.type],
  [ROLE.MORE]: [MoreButtonLayout.type],
});

const DEFAULT_TRACKERS = Object.freeze({
  ...Workflow.DEFAULT_TRACKERS,
  [ROLE.PRODUCTS]: DEFAULT_TRACKER_OPTIONS,
});

const DEFAULT_PAGINATION = Object.freeze({
  active: false,
  mode: 'infiniteScroll',
  pageLimit: 10,
});

const DEFAULT_OPTIONS = Object.freeze({
  ...Workflow.DEFAULT_OPTIONS,
  api: DEFAULT_API_OPTIONS,
  layouts: DEFAULT_LAYOUTS,
  trackers: DEFAULT_TRACKERS,
  pagination: DEFAULT_PAGINATION,
});

const ROLES_OPTIONS = mergeRolesOptions(Workflow.ROLES_OPTIONS, {
  main: ROLE.PRODUCTS,
  members: Object.keys(DEFAULT_LAYOUTS),
  mappings: {
    [ROLE.FACETS]: 'facet_counts',
    [ROLE.SORT]: mappingSortData,
  },
});

export default class SearchBasedWorkflow extends Workflow {

  _initSubscriptions(args) {
    super._initSubscriptions(args);
    this._unsubscribes = [
      ...this._unsubscribes,
      this._hub.on(fields.query(), args => this._query(args)),
      this._hub.on(fields.filters(), () => this._refine()),
      this._hub.on(fields.more(), () => this._more()),
      this._views.get(ROLE.SORT).on('select', event => this._handleSortSelect(event)),
    ];
  }

  restart() {
    super.restart();
    this._page = 0;
  }

  // properties //
  get exhausted() {
    const data = this._hub.states[fields.data()];
    return !!(data && data.meta && data.meta.exhausted);
  }

  get page() {
    return this._page;
  }

  // query //
  autoQuery(options = {}) {
    autoQueryFn.call(this, options);
  }

  query(args) {
    if (!args.q) {
      throw new Error(`q is required in query() call`);
    }
    this._hub.update(fields.query(), args);
  }

  _query(args) {
    // keep track of the query args for refine and more calls
    this._queryArgs = args;

    // reset filters view
    this._views.filters.reset();
    this._views.filters.apply({ silent: true });
    this._views.filters._events.emit('reset'); // TODO: ad-hoc

    // start a new session
    this.restart();

    // payload
    const payload = this._buildPayload(args);

    this._request({ payload });
  }

  _refine() {
    // remember current facet_counts
    const { facet_counts } = this._hub.states[fields.data()].value || {};
    this._currentFacetCounts = facet_counts;

    // start a new session
    this.restart();

    // payload
    const query = this._getQuery();
    const payload = this._buildPayload(query);

    this._request({ payload });
  }

  // TODO: expose API
  _more() {
    // if still loading, complain
    if (this.status !== STATUS.READY) {
      throw new Error(`Can not call more() while loading.`);
    }
    // no more pages, ignore
    if (this.exhausted || this._page >= DEFAULT_PAGE_LIMIT - 1) {
      return;
    }
    // don't create a new session!

    this._page++;

    // payload
    const query = this._getQuery();
    let payload = this._buildPayload(query);
    payload = this._processPayloadForMoreRequest(payload);

    this._request({ payload });
  }

  _getQuery() {
    // TODO: just get from the hub
    return this._queryArgs;
  }

  _getPageSize() {
    return this._options.resolved.api.payload.rows;
  }

  _buildPayload(payload) {
    payload = this._writeFiltersToPayload(payload);
    payload = this._writePageInfoToPayload(payload);
    return payload;
  }

  _writeFiltersToPayload(payload) {
    const filters = this._hub.states[fields.filters()];
    const { facets, sort } = filters || {};
    return trimObj({
      ...payload,
      facet_filters: this._buildFacetFilters(facets),
      order_by: this._buildOrderBy(sort),
    });
  }

  _buildFacetFilters(facets) {
    if (!facets) {
      return undefined;
    }
    const filters = {};
    for (const field in facets) {
      const values = facets[field];
      if (!values || !values.length) {
        continue; // just in case
      }
      filters[field] = {
        terms: values,
      };
    }
    return Object.keys(filters).length ? filters : undefined;
  }

  _buildOrderBy(sort) {
    if (!sort) {
      return undefined;
    }
    return asArray(sort);
  }

  _writePageInfoToPayload(payload) {
    return {
      ...payload,
      _meta: {
        ...payload._meta,
        page: this._page,
      },
    };
  }

  _processPayloadForMoreRequest(payload = {}) {
    const data = this._hub.states[fields.data()];
    const { [this._roles.main]: items = [] } = (data && data.value) || {};
    const productIds = items.map(item => item.product_id).filter(v => v);
    const exclude = [...(payload.exclude || []), ...productIds];
    if (exclude.length === 0) {
      return payload;
    }
    return {
      ...payload,
      exclude,
    };
  }

  // data //
  _defaultProcessData(data) {
    data = super._defaultProcessData(data);
    data = writeKeywordsToData(data);
    data = retainFacetCountsInData(data, this._currentFacetCounts);
    data = writeExhaustionToData(data, { role: this._roles.main });
    return data;
  }

  _updateDataInHub(data) {
    data = this._appendResultsFromMoreRequest(data);
    super._updateDataInHub(data);
  }

  _appendResultsFromMoreRequest(data) {
    const { request } = data;
    if (!request) {
      return data; // the initial state
    }
    const { _meta } = request.payload;
    if (!_meta || !_meta.page) {
      return data; // not from "more" request
    }
    // concat records if it's from "more" request
    const currentData = this._hub.states[fields.data()];
    return concatItemsFromMoreResponse(currentData, data, { role: this._roles.main });
  }

  // view actions //
  _handleSortSelect({ value } = {}) {
    if (!value) {
      return;
    }
    this._views.filters.update({ sort: value });
    this._views.filters.apply();
  }

}

makeConfigurable(SearchBasedWorkflow.prototype, [WORKFLOW_CONFIGURABLE.PAGINATION, WORKFLOW_CONFIGURABLE.FILTERS]);

Object.assign(SearchBasedWorkflow, {
  DEFAULT_API_OPTIONS,
  DEFAULT_LAYOUTS,
  DEFAULT_TRACKERS,
  DEFAULT_PAGINATION,
  DEFAULT_OPTIONS,
  ROLES_OPTIONS,
});
