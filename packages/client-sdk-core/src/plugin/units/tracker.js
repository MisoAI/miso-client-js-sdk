import { isElement, findInAncestors, trimObj, asArray, computeIfAbsent, EventEmitter } from '@miso.ai/commons';
import { viewable as whenViewable } from '../../utils';
import { EVENT_TYPE, TRACKING_STATE, validateEventType, validateTrackingState } from './constants';

function mergeOptions(def, opt) {
  // if opt is falsy then return false, merge otherwise
  return !!opt && { ...def, ...opt };
}

const DEFAULT_TRACKING_OPTIONS = {
  autoScan: true,
  viewable: {
    area: 0.5,
    duration: 1000,
  },
  click: {
    lenient: false,
  }
};

export default class Tracker {

  constructor(unit) {
    this._unit = unit;
    (this._events = new EventEmitter())._injectSubscribeInterface(this);
    this._viewables = new WeakMap();
    this._handleClick = this._handleClick.bind(this);
    this._states = new States();

    this._unit.items.on('change', this._handleItemsChange.bind(this));
  }

  start(options) {
    if (!this._unit.element) {
      throw new Error(`The unit has no bound element. Call unit.bind(element) to associated the unit to an element.`);
    }
    if (this._options) {
      // throw, for the options could be different and this won't be idempotent
      throw new Error(`Already tracking events.`);
    }
    // settle tracking options
    this._options = this._normalizeOptions(options);

    this._trackClicks();

    if (this._options.autoScan) {
      this._unit.items.scan();
    }
  }

  impression(productIds) {
    this._trigger(productIds, EVENT_TYPE.IMPRESSION, true);
  }

  viewable(productIds) {
    this._trigger(productIds, EVENT_TYPE.VIEWABLE, true);
  }

  click(productIds) {
    this._trigger(productIds, EVENT_TYPE.CLICK, true);
  }

  getState(productId) {
    return this._states.getFullState(productId);
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

  _handleItemsChange({ bounds, unbounds }) {
    this._untrackViewables(unbounds);
    this._trackImpressions(bounds);
    this._trackViewables(bounds);
  }

  _handleItemsBind(bindings) {
    this._trackImpressions(bindings);
    this._trackViewables(bindings);
  }

  _handleItemsUnbind(bindings) {
    this._untrackViewables(bindings);
  }

  _trackImpressions(bindings) {
    const options = this._options.impression;
    if (!options) {
      return;
    }
    this._trigger(bindings.map(b => b.productId), EVENT_TYPE.IMPRESSION);
  }

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
    const type = EVENT_TYPE.VIEWABLE;
    const state = this._states.get(productId, type);
    if (state !== TRACKING_STATE.UNTRACKED) {
      return;
    }
    this._states.set(productId, type, TRACKING_STATE.TRACKING);

    const { area, duration } = this._options.viewable;
    // abort signal
    const ac = new AbortController();
    const { signal } = ac;
    this._viewables.set(element, { ac });
    await whenViewable(element, { area, duration, signal });
    this._trigger([productId], type);
  }

  _untrackViewableOnElement({ productId, element }) {
    const viewable = this._viewables.get(element);
    if (!viewable) {
      return;
    }
    this._states.set(productId, EVENT_TYPE.VIEWABLE, TRACKING_STATE.UNTRACKED);
    viewable.ac.abort();
    this._viewables.delete(element);
  }

  _untrackViewables(bindings) {
    for (const binding of bindings) {
      this._untrackViewableOnElement(binding);
    }
  }

  _trackClicks() {
    this._states.setGlobal(EVENT_TYPE.CLICK, TRACKING_STATE.TRACKING);
    this._unit.element.addEventListener('click', this._handleClick);
  }

  _untrackClicks() {
    this._states.setGlobal(EVENT_TYPE.CLICK, TRACKING_STATE.UNTRACKED);
    this._unit.element.removeEventListener('click', this._handleClick);
  }

  _destroy() {
    // assume _unit.items are destroyed later
    this._untrackViewables(this._unit.items.list());
    this._untrackClicks();
  }

  _handleClick(event) {
    const options = this._options && this._options.click;
    if (!options) {
      return;
    }
    const items = this._unit.items;
    const binding = findInAncestors(event.target, element => items.get(element));
    if (!binding) {
      return;
    }
    const { productId } = binding;

    if (!options.lenient) {
      // only left click counts

      // event isPreventDefault

      // go through a real link

      // TODO
    }
    this._trigger([productId], EVENT_TYPE.CLICK);
  }

  _trigger(productIds, type, manual) {
    validateEventType(type);

    // ignore already triggered
    productIds = this._states.untriggered(asArray(productIds), type);

    if (productIds.length === 0) {
      return;
    }
    this._states.set(productIds, type, TRACKING_STATE.TRIGGERED);

    this._events.emit('event', {
      type,
      productIds,
      manual,
    });
  }

}

class States {

  static NEW = {
    [EVENT_TYPE.IMPRESSION]: TRACKING_STATE.UNTRACKED,
    [EVENT_TYPE.VIEWABLE]: TRACKING_STATE.UNTRACKED,
  };

  static UNTRACKED = Object.freeze({
    [EVENT_TYPE.IMPRESSION]: TRACKING_STATE.UNTRACKED,
    [EVENT_TYPE.VIEWABLE]: TRACKING_STATE.UNTRACKED,
    [EVENT_TYPE.CLICK]: TRACKING_STATE.UNTRACKED,
  });

  constructor() {
    this._states = new Map(); // productId -> {impression, viewable, click}
    this._global = { ...States.UNTRACKED };
  }

  getFullState(productId) {
    // when we receive a bind event, impression is trigger, making an entry here
    // so if the state is not found, the product is not present yet => all untracked
    const state = this._states.get(productId);
    return state ? Object.freeze({ ...this._global, ...state }) : States.UNTRACKED;
  }

  get(productId, type) {
    const state = this._states.get(productId);
    return state ? state[type] || this._global[type] : TRACKING_STATE.UNTRACKED;
  }

  setGlobal(type, state) {
    validateEventType(type);
    validateTrackingState(state);
    this._global[type] = state;
  }

  set(productIds, type, state) {
    validateEventType(type);
    validateTrackingState(state);
    for (const productId of asArray(productIds)) {
      this._setOne(productId, type, state);
    }
  }

  _setOne(productId, type, state) {
    // leave click untracked/tracking judged by its global state
    computeIfAbsent(this._states, productId, () => ({ ...States.NEW }))[type] = state;
  }

  untriggered(productIds, type) {
    return productIds.filter(productId => this.get(productId, type) !== TRACKING_STATE.TRIGGERED);
  }

}
