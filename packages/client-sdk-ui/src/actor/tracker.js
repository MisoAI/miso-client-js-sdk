import { STATUS, ATTR_DATA_MISO_PRODUCT_ID } from '../constants.js';
import * as fields from './fields.js';
import _Tracker from '../util/tracker.js';
import { toInteraction } from './utils.js';

function isReady(viewState) {
  return viewState && viewState.status === STATUS.READY;
}

export default class Tracker {

  constructor(hub, view, { active, items, ...options } = {}) {
    this._hub = hub;
    this._view = view;
    const role = this._role = view.role;

    this._tracker = new _Tracker({
      items: {
        itemAttrName: ATTR_DATA_MISO_PRODUCT_ID,
        ...items,
      },
      proxyElement: view.proxyElement,
      sessionId: () => this._getSessionId(),
      active: active || (() => this._isViewReady()),
      ...options,
    });

    this._unsubscribes = [
      this._tracker.on('*', data => this._handleEvent(data)),
      hub.on(fields.view(role), () => this.refresh()),
    ];

    this.refresh();
  }

  config(options) {
    const { active } = this._hub;
    if (active) {
      throw new Error(`Cannot change configuration after workflow starts.`);
    }
    this._tracker.config(options);
  }

  start() {
    throw new Error(`workflow.tracker.start() is deprecated. Use workflow.startTracker() instead.`);
  }

  refresh() {
    this._tracker.refresh();
  }

  impression(productIds, options) {
    this._assertViewReady();
    this._tracker.impression(productIds, options);
  }

  viewable(productIds, options) {
    this._assertViewReady();
    this._tracker.viewable(productIds, options);
  }

  click(productIds, options) {
    this._assertViewReady();
    this._tracker.click(productIds, options);
  }

  _assertViewReady() {
    if (!this._hub.active) {
      throw new Error(`Workflow is not active. Call workflow.start() to activate it.`);
    }
    if (!isReady(this._getViewState())) {
      throw new Error(`Workflow is not rendered yet. If you handle rendering by yourself, call workflow.notifyViewUpdate() when DOM is ready.`);
    }
  }

  _getViewState() {
    return this._hub.states[fields.view(this._role)];
  }

  _isViewReady() {
    return this._hub.active && isReady(this._getViewState());
  }

  _getSessionId() {
    const { session } = this._getViewState() || {};
    return session && session.uuid;
  }

  _getMisoId() {
    const state = this._getViewState();
    return (state && state.meta && state.meta.miso_id) || (this._element && this._element.getAttribute('miso-id')) || undefined;
  }

  getState(productId) {
    return this._tracker.getState(productId);
  }

  _handleEvent(data) {
    const property = this._role === 'results' ? 'products' : this._role; // TODO: ad-hoc, see #83
    const misoId = this._getMisoId();
    this._hub.trigger(fields.interaction(), toInteraction({ property, misoId }, data));
  }

  _destroy() {
    for (const unsubscribe of this._unsubscribes) {
      unsubscribe();
    }
    this._unsubscribes = [];
    this._tracker.destroy();
  }

}
