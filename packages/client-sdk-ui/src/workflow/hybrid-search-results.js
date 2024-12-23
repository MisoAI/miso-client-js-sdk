import { trimObj } from '@miso.ai/commons';
import SearchBasedWorkflow from './search-based.js';
import { fields } from '../actor/index.js';
import { ROLE } from '../constants.js';
import { writeFiltersToPayload } from './processors.js';

const ROLES_CONFIG = Object.freeze({
  main: ROLE.PRODUCTS,
  [ROLE.FACETS]: {
    mapping: 'facet_counts',
  },
});

export default class HybridSearchResults extends SearchBasedWorkflow {

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

  _initSession() {} // no reset here, will manually reset later

  // lifecycle //
  _emitLifecycleEvent(name, event) {
    super._emitLifecycleEvent(name, event);
    this._superworkflow._emitLifecycleEvent(name, event);
  }

  // query //
  _getQuery() {
    // get stored query from sibling
    return this._superworkflow._answer._hub.states[fields.query()];
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

}
