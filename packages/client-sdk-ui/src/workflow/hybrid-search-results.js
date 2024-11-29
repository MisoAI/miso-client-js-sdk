import { trimObj } from '@miso.ai/commons';
import Workflow from './base.js';
import { fields } from '../actor/index.js';
import { ROLE, STATUS } from '../constants.js';
import { mergeApiOptions } from './options.js';
import { writeKeywordsToData, composeFq } from './processors.js';

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
      roles: [ROLE.PRODUCTS, ROLE.KEYWORDS, ROLE.HITS, ROLE.FACETS],
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
    ];
  }

  _initReset() {} // no reset here, will manually reset later

  // query //
  _refine(filters) {
    // remember current facet_counts
    const { facet_counts } = this._hub.states[fields.data()].value || {};
    this._previousFacetCounts = facet_counts;

    // start a new session
    this.restart();

    // get stored query from sibling
    const query = this._superworkflow._answer._hub.states[fields.query()];
    const payload = this._buildPayload({ ...query, filters });
    const { session } = this;
    const event = mergeApiOptions(this._options.resolved.api, { payload, session });

    this._request(event);
  }

  _buildPayload({ filters, ...payload } = {}) {
    // borrow the work from the sibling
    payload = this._superworkflow._answer._buildPayload(payload);
    payload = this._writeFqToPayload({ ...payload, filters });
    payload = this._writeQuestionIdToPayload(payload);
    return { ...payload, answer: false };
  }

  _writeFqToPayload({ filters, ...payload } = {}) {
    const fq = composeFq(filters); // TODO: combine with fq in payload?
    return trimObj({
      ...payload,
      fq,
    });
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

  _request(event) {
    this._hub.update(fields.request(), event);
  }

  // data //
  _defaultProcessData(data) {
    data = super._defaultProcessData(data);
    data = writeKeywordsToData(data);
    data = this._retainFacetCounts(data);
    return data;
  }

  _retainFacetCounts(data) {
    if (!this._previousFacetCounts) {
      return data;
    }
    const { status, value } = data;
    switch (status) {
      case STATUS.INITIAL:
      case STATUS.LOADING:
        break;
      default:
        return data;
    }
    if (value && value.facet_counts) {
      return data;
    }
    return {
      ...data,
      value: {
        ...value,
        facet_counts: this._previousFacetCounts,
      },
    };
  }

}
