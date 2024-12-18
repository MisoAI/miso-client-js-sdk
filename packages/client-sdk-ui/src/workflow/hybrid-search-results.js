import { trimObj } from '@miso.ai/commons';
import Workflow from './base.js';
import { fields } from '../actor/index.js';
import { ROLE } from '../constants.js';
import { writeKeywordsToData, writeFiltersToPayload, retainFacetCounts, markExhaustion, concatResults } from './processors.js';

const DEFAULT_PAGE_LIMIT = 10;

const ROLES_CONFIG = Object.freeze({
  [ROLE.FACETS]: {
    mapping: 'facet_counts',
  },
});

export default class HybridSearchResults extends Workflow {

  constructor(superworkflow) {
    super({
      name: 'hybrid-search/results',
      plugin: superworkflow._plugin,
      client: superworkflow._client,
      options: superworkflow._options,
      roles: [ROLE.PRODUCTS, ROLE.KEYWORDS, ROLE.HITS, ROLE.FACETS, ROLE.MORE],
      rolesConfig: ROLES_CONFIG,
      superworkflow,
    });
  }

  _initProperties(args) {
    super._initProperties(args);
    this._superworkflow = args.superworkflow;
  }

  _initSubscriptions(args) {
    super._initSubscriptions(args);
    this._unsubscribes = [
      ...this._unsubscribes,
      this._hub.on(fields.filters(), filters => this._refine(filters)),
      this._hub.on(fields.more(), () => this._more()),
    ];
  }

  _initSession() {} // no reset here, will manually reset later

  restart() {
    super.restart();
    this._page = 0;
  }

  // properties //
  get exhausted() {
    const data = this._hub.states[fields.data()];
    return !!(data && data.meta && data.meta.exhausted);
  }

  // query //
  _refine(filters) {
    // remember current facet_counts
    const { facet_counts } = this._hub.states[fields.data()].value || {};
    this._currentFacetCounts = facet_counts;

    // start a new session
    this.restart();

    const query = this._getQuery();
    const payload = this._buildPayload({ ...query, filters });

    this._request({ payload });
  }

  _more() {
    if (this.exhausted || this._page >= DEFAULT_PAGE_LIMIT - 1) {
      return; // ignore
    }
    // don't create a new session

    const query = this._getQuery();
    const filters = this._hub.states[fields.filters()]; // get stored filters
    const start = (this._page + 1) * this._getPageSize();
    const payload = this._buildPayload({ ...query, filters, start });

    this._request({ payload });

    this._page++;
  }

  _getQuery() {
    // get stored query from sibling
    return this._superworkflow._answer._hub.states[fields.query()];
  }

  _getPageSize() {
    return this._options.resolved.api.payload.rows;
  }

  _buildPayload({ filters, ...payload } = {}) {
    // borrow the work from the sibling
    payload = this._superworkflow._answer._buildPayload(payload);
    payload = writeFiltersToPayload(payload, filters);
    payload = this._writeQuestionIdToPayload(payload);
    return { ...payload, answer: false };
  }

  _writeQuestionIdToPayload(payload) {
    return {
      ...payload,
      _meta: trimObj({
        ...payload._meta,
        question_id: this._superworkflow._answer.questionId,
      }),
    };
  }

  // data //
  _defaultProcessData(data) {
    data = super._defaultProcessData(data);
    data = writeKeywordsToData(data);
    data = retainFacetCounts(data, this._currentFacetCounts);
    data = markExhaustion(data);
    return data;
  }

  _updateDataInHub(data) {
    data = this._appendResultsFromMoreRequest(data);
    super._updateDataInHub(data);
  }

  _appendResultsFromMoreRequest(data) {
    const { request } = data;
    if (!request || !request.payload.start) {
      return data; // the initial state, or not from "more" request
    }
    /*
    if (status !== STATUS.READY || !request || !value) {
      return data;
    }
    */
    // concat records if it's from "more" request
    const currentData = this._hub.states[fields.data()];
    return concatResults(currentData, data);
  }

}
