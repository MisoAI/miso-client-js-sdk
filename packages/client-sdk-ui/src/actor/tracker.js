import { asArray } from '@miso.ai/commons';
import { TRACKING_EVENT_TYPES, TRACKING_STATUS, validateEventType } from '../constants.js';
import * as fields from './fields.js';
import States from '../util/states.js';
import { toInteraction } from './utils.js';

const VALUELESS_ITEMS = [Symbol('valueless')];

export default class Tracker {

  constructor({ hub, role, valueless = false, options }) {
    this._hub = hub;
    this._role = role;
    this._valueless = !!valueless;
    this._options = options;
    // TODO: know item type

    this._states = new States(this._getSessionId());
  }

  get options() {
    return typeof this._options === 'function' ? this._options() : this._options;
  }

  getState(item) {
    return this._states.getFullState(item);
  }

  _trigger(type, items, meta = {}) {
    if (this._valueless) {
      meta = items;
      items = VALUELESS_ITEMS;
    }
    validateEventType(type);
    this._syncSession();

    items = this._states.untriggered(asArray(items), type);
    if (items.length === 0) {
      return;
    }
    this._states.set(items, type, TRACKING_STATUS.TRIGGERED);

    const property = this._role === 'results' ? 'products' : this._role; // TODO: ad-hoc, see #83
    const misoId = this._getMisoId();
    const request = this._getRequestPayload();
    const values = this._valueless ? undefined : items;

    // TODO: should trigger 'tracker' and let workflow translate to interactions
    this._hub.trigger(fields.interaction(), toInteraction({ property, misoId, request }, { event: type, values, meta }));
  }

  _syncSession() {
    const sessionId = this._getSessionId();
    if (!sessionId) {
      return;
    }
    if (!this._states || sessionId !== this._states.sessionId) {
      this._states = new States(sessionId);
    }
  }

  _getSessionId() {
    const { session } = this._getViewState() || {};
    return session && session.uuid;
  }

  _getMisoId() {
    const state = this._getViewState();
    return (state && state.meta && state.meta.miso_id) || undefined;
  }

  _getRequestPayload() {
    const { request } = this._getViewState() || {};
    return request && request.payload;
  }

  _getViewState() {
    return this._hub.states[fields.view(this._role)];
  }

}

for (const type of TRACKING_EVENT_TYPES) {
  Tracker.prototype[type] = function(items, meta) {
    this._trigger(type, items, meta);
  };
}
