import { trimObj, uuidToTimestamp } from '@miso.ai/commons';
import { STATUS, ATTR_DATA_MISO_PRODUCT_ID } from '../constants';
import * as fields from './fields';
import _Tracker from '../util/tracker';

function isReady(viewState) {
  return viewState && viewState.status === STATUS.READY;
}

export default class Tracker {

  constructor(hub, view) {
    this._hub = hub;
    this._view = view;
    const role = this._role = view.role;
    this._tracker = new _Tracker({
      itemIdAttrName: ATTR_DATA_MISO_PRODUCT_ID,
      proxyElement: view.proxyElement,
      sessionId: () => this._getSessionId(),
      active: () => this._isViewReady(),
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

  _handleEvent({ event, items, manual }) {
    this._hub.trigger(fields.interaction(), this._buildInteraction({ event, items, manual }));
  }

  _buildInteraction({ event, items, manual }) {
    const misoId = this._getMisoId();
    let api_ts;
    if (misoId) {
      try {
        api_ts = uuidToTimestamp(misoId);
      } catch (e) {}
    }
    return trimObj({
      type: event === 'viewable' ? 'viewable_impression' : event,
      product_ids: items,
      miso_id: misoId,
      context: {
        custom_context: trimObj({
          api_ts,
          property: this._role === 'results' ? 'products' : this._role, // TODO: ad-hoc, see #83
          trigger: manual ? 'manual' : 'auto',
        }),
      },
    });
  }

  _destroy() {
    for (const unsubscribe of this._unsubscribes) {
      unsubscribe();
    }
    this._unsubscribes = [];
    this._tracker.destroy();
  }

}
