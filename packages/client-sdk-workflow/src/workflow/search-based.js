import { asArray, trimObj, mergeInteractions } from '@miso.ai/commons';
import Workflow from './base.js';
import { fields } from '../actor/index.js';
import { STATUS, ROLE, WORKFLOW_CONFIGURABLE, REQUEST_TYPE } from '../constants.js';
import { mappingSortData, writeKeywordsToData, retainFacetCountsInData, writeExhaustionToData, writeMisoIdAsRootMisoId, concatItemsFromMoreResponse } from './processors.js';
import { mergeRolesOptions, autoQuery as autoQueryFn, updateQueryParametersInUrl, makeConfigurable } from './options/index.js';
import { enableUseLink } from './use-link.js';

const DEFAULT_PAGE_LIMIT = 10;

const ROLES_OPTIONS = mergeRolesOptions(Workflow.ROLES_OPTIONS, {
  main: ROLE.PRODUCTS,
  members: [ROLE.QUERY, ROLE.PRODUCTS, ROLE.KEYWORDS, ROLE.TOTAL, ROLE.FACETS, ROLE.SORT, ROLE.MORE],
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
      this._views.on(ROLE.SORT, 'select', event => this._handleSortSelect(event)),
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
    if (this._linkFn) {
      this._submitToPage(args);
      return;
    }
    const type = REQUEST_TYPE.QUERY;

    // reset filters view
    this._views.filters.reset({ silent: true });

    // start a new session
    this.restart({ type });

    // payload
    const payload = this._buildPayload(args, type);

    this._request({ payload, type });
  }

  _refine() {
    const type = REQUEST_TYPE.REFINE;

    // remember current facet_counts
    const { facet_counts } = this._hub.states[fields.data()].value || {};
    this._currentFacetCounts = facet_counts;

    // start a new session
    this.restart({ type });

    // payload
    const query = this._getQuery();
    const payload = this._buildPayload(query, type);

    this._request({ payload, type });
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
    const type = REQUEST_TYPE.MORE;
    const query = this._getQuery();
    const payload = this._buildPayload(query, type);

    this._request({ payload, type });
  }

  _getQuery() {
    return this._hub.states[fields.query()];
  }

  _getPageSize() {
    return this._options.resolved.api.payload.rows;
  }

  _buildPayload(payload, type) {
    payload = this._writeFiltersToPayload(payload);
    payload = this._writePageInfoToPayload(payload);
    if (type === REQUEST_TYPE.MORE) {
      payload = this._processPayloadForMoreRequest(payload);
    }
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
      metadata: {
        ...payload.metadata,
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

  _writeRequestTimeToSession(timestamp, options = {}) {
    if (options.type !== REQUEST_TYPE.QUERY) {
      return;
    }
    super._writeRequestTimeToSession(timestamp, options);
  }

  // data //
  _defaultProcessData(data, oldData) {
    data = super._defaultProcessData(data, oldData);
    data = writeKeywordsToData(data);
    data = retainFacetCountsInData(data, this._currentFacetCounts);
    data = writeExhaustionToData(data, { role: this._roles.main });
    return data;
  }

  _updateData(data) {
    super._updateData(data);
    updateQueryParametersInUrl.call(this, data);
  }

  _updateDataInHub(data, oldData) {
    data = this._appendResultsFromMoreRequest(data);
    super._updateDataInHub(data, oldData);
  }

  _appendResultsFromMoreRequest(data) {
    const { request } = data;
    if (!request) {
      return data; // the initial state
    }
    const { metadata } = request.payload;
    if (!metadata || !metadata.page) {
      return writeMisoIdAsRootMisoId(data); // not from "more" request
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

  // interactions //
  _defaultProcessInteraction(payload, args) {
    payload = super._defaultProcessInteraction(payload, args);
    payload = this._writeRootMisoIdToInteraction(payload);
    return payload;
  }

  _writeRootMisoIdToInteraction(payload) {
    const data = this._hub.states[fields.data()];
    const { root_miso_id } = (data && data.value) || {};
    if (!root_miso_id) {
      return payload;
    }
    return mergeInteractions(payload, {
      context: {
        custom_context: {
          root_miso_id,
        }
      }
    });
  }

}

makeConfigurable(SearchBasedWorkflow.prototype, [WORKFLOW_CONFIGURABLE.PAGINATION, WORKFLOW_CONFIGURABLE.FILTERS]);

enableUseLink(SearchBasedWorkflow.prototype);

Object.assign(SearchBasedWorkflow, {
  ROLES_OPTIONS,
});
