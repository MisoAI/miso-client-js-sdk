import { trimObj } from '@miso.ai/commons';
import SearchBasedWorkflow from './search-based.js';
import { fields } from '../actor/index.js';
import { ROLE } from '../constants.js';
import { writeMisoIdToSession } from './processors.js';

// we want to override members, not adding to it
const ROLES_OPTIONS = {
  ...SearchBasedWorkflow.ROLES_OPTIONS,
  members: [ROLE.PRODUCTS, ROLE.KEYWORDS, ROLE.TOTAL, ROLE.FACETS, ROLE.SORT, ROLE.MORE, ROLE.ERROR],
};

export default class HybridSearchResults extends SearchBasedWorkflow {

  constructor(superworkflow) {
    super({
      name: 'hybrid-search/results',
      plugin: superworkflow._plugin,
      client: superworkflow._client,
      options: superworkflow._options,
      defaults: superworkflow._defaults,
      roles: ROLES_OPTIONS,
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

  _buildPayload(payload) {
    // borrow the work from the sibling
    payload = this._superworkflow._answer._writeQuestionSourceToPayload(payload);
    payload = this._writeFiltersToPayload(payload);
    payload = this._writePageInfoToPayload(payload);
    payload = this._writeQuestionIdToPayload(payload);
    return { ...payload, answer: false };
  }

  _buildOrderBy(sort) {
    if (!sort) {
      return undefined;
    }
    // works differently than search
    return sort.field;
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
    writeMisoIdToSession(data);
    return data;
  }

  // interactions //
  _defaultProcessInteraction(payload, args) {
    return this._superworkflow._defaultProcessInteraction(payload, args);
  }

  _defaultProcessInteraction0(payload, args) {
    return super._defaultProcessInteraction(payload, args);
  }

}

Object.assign(HybridSearchResults, {
  ROLES_OPTIONS,
});
