import { isElement, findInAncestors, trimObj, asArray, computeIfAbsent, viewable as whenViewable } from '@miso.ai/commons';
import { EVENT_TYPE, TRACKING_STATUS, validateEventType, validateTrackingStatus } from '../constants';
import Items from './items';

const { IMPRESSION, VIEWABLE, CLICK } = EVENT_TYPE;
const { UNTRACKED, TRACKING, TRIGGERED } = TRACKING_STATUS;

function mergeOptions(def, opt) {
  // if opt is falsy then return false, merge otherwise
  return !!opt && { ...def, ...opt };
}

const DEFAULT_TRACKING_OPTIONS = Object.freeze({
  impression: Object.freeze({
  }),
  viewable: Object.freeze({
    area: 0.5,
    duration: 1000,
  }),
  click: Object.freeze({
    lenient: false,
  }),
  watch: false,
});

export default class Tracker {

  constructor(saga) {
    this._saga = saga;
    this._items = new Items(saga);
    this._viewables = new WeakMap();
    this._options = DEFAULT_TRACKING_OPTIONS;

    this._unsubscribes = [
      saga.elements.proxy('results').on('click', event => this._handleClick(event)),
      saga.elements.on('results', () => this.refresh()),
      saga.on('view', () => this.refresh()),
    ];

    this.refresh();
  }

  config(options) {
    const { active } = this._saga;
    if (active) {
      throw new Error(`Cannot change configuration after unit starts.`);
    }
    this._options = this._normalizeOptions(options);
  }

  _normalizeOptions({ impression = {}, viewable = {}, click = {}, ...options } = {}) {
    return trimObj({
      ...DEFAULT_TRACKING_OPTIONS,
      ...options,
      impression: mergeOptions(DEFAULT_TRACKING_OPTIONS.impression, impression),
      viewable: mergeOptions(DEFAULT_TRACKING_OPTIONS.viewable, viewable),
      click: mergeOptions(DEFAULT_TRACKING_OPTIONS.click, click),
    });
  }

  start() {
    throw new Error(`unit.tracker.start() is deprecated. Use unit.startTracker() instead.`);
  }

  refresh() {
    // refresh against unit element
    this._syncElement();

    // refresh against view state
    const { view: viewState } = this._saga.states;
    if (!viewState) {
      return;
    }
    const { session } = viewState;
    if (this._states && session.uuid !== this._states.uuid) {
      this._retireStates();
    }
    if (!this._states) {
      this._states = new States(session.uuid);
    }

    // refresh items
    this._refreshItems();
  }

  impression(productIds) {
    this._assertViewReady();
    this._trigger(productIds, IMPRESSION, true);
  }

  viewable(productIds) {
    this._assertViewReady();
    this._trigger(productIds, VIEWABLE, true);
  }

  click(productIds) {
    this._assertViewReady();
    this._trigger(productIds, CLICK, true);
  }

  _assertViewReady() {
    const { view: viewState } = this._saga.states;
    if (!this._saga.active) {
      throw new Error(`Unit is not active. Call unit.start() to activate it.`);
    }
    if (!viewState || viewState.status !== 'ready') {
      throw new Error(`Unit is not rendered yet. If you handle rendering by yourself, call unit.notifyViewUpdate() when DOM is ready.`);
    }
  }

  _isViewReady() {
    const { view: viewState } = this._saga.states;
    return this._saga.active && viewState && viewState.status === 'ready';
  }

  getState(productId) {
    return Object.freeze({
      [CLICK]: this._saga.elements.get('results') ? TRACKING : UNTRACKED,
      ...this._states.getFullState(productId),
    });
  }



  _retireStates() {
    const { unbounds } = this._items.unbindAll();
    this._untrackViewables(unbounds);
    this._states = undefined;
  }

  _refreshItems() {
    if (!this._states) {
      return;
    }
    const { bounds, unbounds } = this._items.refresh();
    this._untrackViewables(unbounds);
    this._trackImpressions(bounds);
    this._trackViewables(bounds);
  }



  // impression //
  _trackImpressions(bindings) {
    const options = this._options.impression;
    if (!options) {
      return;
    }
    this._trigger(bindings.map(b => b.productId), IMPRESSION);
  }



  // viewable //
  _trackViewables(bindings) {
    const options = this._options.viewable;
    if (!options) {
      return;
    }
    // TODO: option: useUnitElement? TBD
    for (const binding of bindings) {
      this._trackViewableOnElement(binding);
    }
  }

  async _trackViewableOnElement({ productId, element }) {
    if (!productId || !isElement(element) || this._viewables.has(element)) {
      return;
    }
    // TODO: when element is replaced without proper unload...
    const type = VIEWABLE;
    const state = this._states.get(productId, type);
    if (state !== UNTRACKED) {
      return;
    }
    this._states.set(productId, type, TRACKING);

    const { area, duration } = this._options.viewable;
    // abort signal
    const ac = new AbortController();
    const { signal } = ac;
    this._viewables.set(element, { ac });
    await whenViewable(element, { area, duration, signal });
    this._viewables.delete(element);
    this._trigger([productId], type);
  }

  _untrackViewableOnElement({ productId, element }) {
    const viewable = this._viewables.get(element);
    if (!viewable) {
      return;
    }
    viewable.ac.abort();
    this._viewables.delete(element);
    const type = VIEWABLE;
    if (this._states.get(productId, type) === TRACKING) {
      this._states.set(productId, type, UNTRACKED);
    }
  }

  _untrackViewables(bindings) {
    for (const binding of bindings) {
      this._untrackViewableOnElement(binding);
    }
  }



  // click //
  _syncElement() {
    const element = this._saga.elements.get('results');
    if (this._element === element) {
      return;
    }
    // remove observer from old element
    this._retireElement();

    // add observer on new element
    if (element) {
      if (this._options.watch) {
        // TODO: use proxy element
        this._mutationObserver = new MutationObserver(() => this.refresh());
        this._mutationObserver.observe(element, { childList: true, subtree: true });
      }
    }
    this._element = element;
  }

  _retireElement() {
    if (!this._element) {
      return;
    }
    if (this._mutationObserver) {
      this._mutationObserver.disconnect();
      this._mutationObserver = undefined;
    }
    this._element = undefined;
  }

  _handleClick(event) {
    const options = this._options && this._options.click;
    if (!options || !this._isViewReady()) {
      return;
    }
    const binding = findInAncestors(event.target, element => this._items.get(element));
    if (!binding) {
      return;
    }
    const { productId } = binding;

    if (!options.lenient) {
      // it must be a left click
      if (event.button !== 0) {
        return;
      }
      // event default must not be prevented
      if (event.defaultPrevented) {
        return;
      }
      // must go through a real link
      if (!findInAncestors(event.target, element => (element.tagName === 'A' && element.href) || undefined)) {
        return;
      }
    }
    this._trigger([productId], CLICK);
  }



  _trigger(productIds, type, manual) {
    validateEventType(type);

    if (!this._isViewReady()) {
      return;
    }

    // ignore already triggered
    productIds = this._states.untriggered(asArray(productIds), type);

    if (productIds.length === 0) {
      return;
    }
    this._states.set(productIds, type, TRIGGERED);
    this._saga.trigger('event', { type, productIds, manual });
  }

  _destroy() {
    this._retireElement();
    this._retireStates();
    this._items._destroy();
    for (const unsubscribe of this._unsubscribes) {
      unsubscribe();
    }
    this._unsubscribes = [];
  }

}

/**
 * Tracking states for a session to keep track of the tracking status of each product.
 * For each entry there are status of impression, viewable, and click events. 
 * The actual click tracking status depends on the presence of root element, which is not respected in this object.
 */
class States {

  static NEW = {
    [IMPRESSION]: UNTRACKED,
    [VIEWABLE]: UNTRACKED,
  };

  static UNTRACKED = Object.freeze({
    [IMPRESSION]: UNTRACKED,
    [VIEWABLE]: UNTRACKED,
    [CLICK]: UNTRACKED,
  });

  constructor(uuid) {
    this.uuid = uuid;
    this._states = new Map(); // productId -> {impression, viewable, click}
  }

  getFullState(productId) {
    // when we receive a bind event, impression is trigger, making an entry here
    // so if the state is not found, the product is not present yet => all untracked
    const state = this._states.get(productId);
    return state ? { ...state } : States.UNTRACKED;
  }

  get(productId, type) {
    const state = this._states.get(productId);
    return state && state[type] || UNTRACKED;
  }

  set(productIds, type, status) {
    validateEventType(type);
    validateTrackingStatus(status);
    for (const productId of asArray(productIds)) {
      this._setOne(productId, type, status);
    }
  }

  _setOne(productId, type, status) {
    // leave click untracked/tracking judged by its global state
    computeIfAbsent(this._states, productId, () => ({ ...States.NEW }))[type] = status;
  }

  untriggered(productIds, type) {
    return productIds.filter(productId => this.get(productId, type) !== TRIGGERED);
  }

}
