import { asArray } from '@miso.ai/commons';
import { EVENT_TYPE, TRACKING_EVENT_TYPES, TRACKING_STATUS, validateEventType } from '../constants.js';
import * as fields from './fields.js';
import States from '../util/states.js';
import { normalizeTrackerOptions } from '../util/trackers.js';
import { toInteraction } from './utils.js';

const { IMPRESSION, VIEWABLE, CLICK } = EVENT_TYPE;

export default class Tracker {

  constructor(hub, view, { active, bindings, ...options } = {}) {
    this._hub = hub;
    this._view = view;
    this._role = view.role;
    // TODO: know item type

    this._states = undefined;
    this.config(options);

    this._unsubscribes = [
      ...TRACKING_EVENT_TYPES.map(type => this._view.trackingEvents.on(type, values => this._trigger(type, values))),
      hub.on(fields.view(view.role), () => this._syncSession()),
    ];

    this._syncSession();
  }

  config(options) {
    this._options = normalizeTrackerOptions(options);
  }

  start() {
    throw new Error(`workflow.tracker.start() is deprecated. Use workflow.startTracker() instead.`);
  }

  impression(items, options) {
    this._trigger(IMPRESSION, items, true);
  }

  viewable(items, options) {
    this._trigger(VIEWABLE, items, true);
  }

  click(items, options) {
    this._trigger(CLICK, items, true);
  }

  _getViewState() {
    return this._hub.states[fields.view(this._role)];
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
    return (state && state.meta && state.meta.miso_id) || (this._element && this._element.getAttribute('miso-id')) || undefined;
  }

  _getRequestPayload() {
    const { request } = this._getViewState() || {};
    return request && request.payload;
  }

  getState(item) {
    return this._states.getFullState(item);
  }

  _trigger(type, items, manual = false) {
    validateEventType(type);

    items = this._states.untriggered(asArray(items), type);
    if (items.length === 0) {
      return;
    }
    this._states.set(items, type, TRACKING_STATUS.TRIGGERED);

    const property = this._role === 'results' ? 'products' : this._role; // TODO: ad-hoc, see #83
    const misoId = this._getMisoId();
    const request = this._getRequestPayload();

    // TODO: should trigger 'tracker' and let workflow translate to interactions
    this._hub.trigger(fields.interaction(), toInteraction({ property, misoId, request }, { event: type, values: items, manual }));
  }

  _destroy() {
    for (const unsubscribe of this._unsubscribes) {
      unsubscribe();
    }
    this._unsubscribes = [];
  }

}
