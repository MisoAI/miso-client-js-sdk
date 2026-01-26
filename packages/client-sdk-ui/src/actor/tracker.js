import { asArray, trimObj } from '@miso.ai/commons';
import { PERFORMANCE_EVENT_TYPES, TRACKING_STATUS, EVENT_TYPE, validateEventType } from '../constants.js';
import * as fields from './fields.js';
import States from '../util/states.js';

// a dummy item array for manipulating deduplication
const ITEMLESS_DUMMY_ITEMS = [Symbol('itemless')];

export default class Tracker {

  constructor({ hub, role, options }) {
    this._hub = hub;
    this._role = role;
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

  _trigger(type, items, meta) {
    validateEventType(type);

    const { options } = this;
    if (!options || options.active === false) {
      return;
    }

    this._syncSession();

    const { deduplicated = true, itemless = false } = options;

    if (deduplicated) {
      if (itemless) {
        items = ITEMLESS_DUMMY_ITEMS;
      }
      items = this._states.untriggered(asArray(items), type);
      if (items.length === 0) {
        return;
      }
      this._states.set(items, type, TRACKING_STATUS.TRIGGERED);
    }

    this._sendToHub({
      type,
      items: itemless ? undefined : items,
      ...meta,
    });
  }

  submit({ value }) {
    this._syncSession();
    this._sendToHub({
      type: EVENT_TYPE.SUBMIT,
      value,
    });
  }

  heartbeat() {
    this._syncSession();
    this._sendToHub({
      type: EVENT_TYPE.HEARTBEAT,
    });
  }

  _sendToHub(args) {
    this._hub.trigger(fields.tracker(), Object.freeze(trimObj({ role: this._role, ...args })));
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

for (const type of PERFORMANCE_EVENT_TYPES) {
  Tracker.prototype[type] = function(items, meta) {
    this._trigger(type, items, meta);
  };
}
