import { EventEmitter, isElement, findInAncestors, trimObj, asArray, viewable as whenViewable } from '@miso.ai/commons';
import { EVENT_TYPE, TRACKING_STATUS, validateEventType } from '../constants';
import Items from './items';
import States from './states';
import ProxyElement from './proxy';

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

  constructor({
    proxyElement,
    element,
    sessionId = 'default',
    active = true,
    itemIdAttrName,
  } = {}) {
    this._events = new EventEmitter({ target: this });
    this._proxyElement = proxyElement || new ProxyElement(element);
    this._getSessionId = typeof sessionId === 'function' ? sessionId : () => sessionId;
    this._isActive = typeof active === 'function' ? active : () => active;
    this._items = new Items({ itemIdAttrName });
    this._viewables = new WeakMap();
    this._options = DEFAULT_TRACKING_OPTIONS;

    this._unsubscribes = [
      this._proxyElement.on('click', event => this._handleClick(event)),
      this._proxyElement.on('element', () => this.refresh()),
    ];

    this.refresh();
  }

  get active() {
    return this._isActive();
  }

  config(options) {
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

  refresh() {
    // refresh against root element
    this._syncElement();
    // refresh against view state
    this._syncStates();
    // refresh items
    this._refreshItems();
  }

  _syncStates() {
    const sessionId = this._getSessionId();
    if (!sessionId) {
      return;
    }
    if (this._states && sessionId !== this._states.sessionId) {
      this._retireStates();
    }
    if (!this._states && sessionId) {
      this._states = new States(sessionId);
    }
  }

  impression(items, options) {
    this._assertActive();
    this._trigger(IMPRESSION, items, { ...options, manual: true });
  }

  viewable(items, options) {
    this._assertActive();
    this._trigger(VIEWABLE, items, { ...options, manual: true });
  }

  click(items, options) {
    this._assertActive();
    this._trigger(CLICK, items, { ...options, manual: true });
  }

  _assertActive() {
    if (!this._isActive()) {
      throw new Error(`Tracker is not active.`);
    }
  }

  getState(itemId) {
    // TODO: do we have to be so precise?
    return Object.freeze({
      [CLICK]: this._proxyElement.current ? TRACKING : UNTRACKED,
      ...this._states.getFullState(itemId),
    });
  }



  _syncElement() {
    this._proxyElement.sync({ silent: true });
    const element = this._proxyElement.current;
    if (this._element === element) {
      return;
    }
    // remove observer from old element
    this._retireElement();

    // add observer on new element
    if (element) {
      if (this._options.watch) {
        // TODO: move to proxy element
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

  _retireStates() {
    const { unbounds } = this._items.unbindAll();
    this._untrackViewables(unbounds);
    this._states = undefined;
  }

  _refreshItems() {
    if (!this._states) {
      return;
    }
    const element = this._proxyElement.current;
    const { bounds, unbounds } = this._items.refresh(element);
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
    this._trigger(IMPRESSION, bindings.map(b => b.item), { bindings });
  }



  // viewable //
  _trackViewables(bindings) {
    const options = this._options.viewable;
    if (!options) {
      return;
    }
    for (const binding of bindings) {
      this._trackViewableOnElement(binding);
    }
  }

  async _trackViewableOnElement(binding) {
    const { item, element } = binding;
    if (!item || !isElement(element) || this._viewables.has(element)) {
      return;
    }
    // TODO: when element is replaced without proper unload...
    const state = this._states.get(item, VIEWABLE);
    if (state !== UNTRACKED) {
      return;
    }
    this._states.set(item, VIEWABLE, TRACKING);

    const { area, duration } = this._options.viewable;
    // abort signal
    const ac = new AbortController();
    const { signal } = ac;
    this._viewables.set(element, { ac });
    await whenViewable(element, { area, duration, signal });
    this._viewables.delete(element);
    this._trigger(VIEWABLE, [item], { bindings: [binding] });
  }

  _untrackViewableOnElement({ item, element }) {
    const viewable = this._viewables.get(element);
    if (!viewable) {
      return;
    }
    viewable.ac.abort();
    this._viewables.delete(element);
    const type = VIEWABLE;
    if (this._states.get(item, type) === TRACKING) {
      this._states.set(item, type, UNTRACKED);
    }
  }

  _untrackViewables(bindings) {
    for (const binding of bindings) {
      this._untrackViewableOnElement(binding);
    }
  }



  // click //
  _handleClick(event) {
    const options = this._options && this._options.click;
    if (!options || !this._isActive()) {
      return;
    }
    const binding = findInAncestors(event.target, element => this._items.get(element));
    if (!binding) {
      return;
    }

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
    this._trigger(CLICK, [binding.item], { bindings: [binding] });
  }



  _trigger(event, items, { manual = false, bindings } = {}) {
    validateEventType(event);

    if (!this._isActive()) {
      return;
    }

    // ignore already triggered
    items = this._states.untriggered(asArray(items), event);

    if (items.length === 0) {
      return;
    }
    this._states.set(items, event, TRIGGERED);
    this._events.emit(event, { event, items, manual, bindings });
  }

  destroy() {
    this._retireElement();
    this._retireStates();
    this._items._destroy();
    for (const unsubscribe of this._unsubscribes) {
      unsubscribe();
    }
    this._unsubscribes = [];
  }

}
