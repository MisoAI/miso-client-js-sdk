import { EventEmitter, isElement, findInAncestors, trimObj, asArray, viewable as whenViewable } from '@miso.ai/commons';
import { EVENT_TYPE, TRACKING_STATUS, validateEventType } from '../constants.js';
import { Bindings } from './bindings.js';
import States from './states.js';
import ProxyElement from './proxy.js';

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

function normalizeOptions(options) {
  if (options === false) {
    return false; // turn off all tracking
  }
  const { impression = {}, viewable = {}, click = {}, ...rest } = options;
  return trimObj({
    ...DEFAULT_TRACKING_OPTIONS,
    ...rest,
    impression: mergeOptions(DEFAULT_TRACKING_OPTIONS.impression, impression),
    viewable: mergeOptions(DEFAULT_TRACKING_OPTIONS.viewable, viewable),
    click: mergeOptions(DEFAULT_TRACKING_OPTIONS.click, click),
  });
}

export default class Tracker {

  constructor({
    proxyElement,
    element,
    sessionId = 'default',
    active = true,
    bindings,
    ...options
  } = {}) {
    this._events = new EventEmitter({ target: this });
    this._proxyElement = proxyElement || new ProxyElement(element);
    this._getSessionId = typeof sessionId === 'function' ? sessionId : () => sessionId;
    this._isActive = typeof active === 'function' ? active : () => active;
    this._bindings = new Bindings(bindings);
    this._viewables = new WeakMap();
    this._options = normalizeOptions(options);

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
    this._options = normalizeOptions(options);
  }

  refresh() {
    // refresh against root element
    this._syncElement();
    // refresh against view state
    this._syncStates();
    // refresh bindings
    this._refreshBindings();
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

  impression(values, options) {
    this._assertActive();
    if (this._options && this._options.impression) {
      this._trigger(IMPRESSION, values, { manual: true, ...options });
    }
  }

  viewable(values, options) {
    this._assertActive();
    if (this._options && this._options.viewable) {
      this._trigger(VIEWABLE, values, { manual: true, ...options });
    }
  }

  click(values, options) {
    this._assertActive();
    if (this._options && this._options.click) {
      this._trigger(CLICK, values, { manual: true, ...options });
    }
  }

  _assertActive() {
    if (!this._isActive()) {
      throw new Error(`Tracker is not active.`);
    }
  }

  getState(value) {
    // TODO: do we have to be so precise?
    return Object.freeze({
      [CLICK]: this._proxyElement.current ? TRACKING : UNTRACKED,
      ...this._states.getFullState(value),
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
      if (this._options && this._options.watch) {
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
    const { unbounds } = this._bindings.unbindAll();
    this._untrackViewables(unbounds);
    this._states = undefined;
  }

  _refreshBindings() {
    if (!this._states) {
      return;
    }
    const element = this._proxyElement.current;
    const { bounds, unbounds } = this._bindings.refresh(element);
    this._untrackViewables(unbounds);
    this._trackImpressions(bounds);
    this._trackViewables(bounds);
  }



  // impression //
  _trackImpressions(bindings) {
    const options = this._options && this._options.impression;
    if (!options) {
      return;
    }
    this._trigger(IMPRESSION, bindings.map(b => b.value), { bindings });
  }



  // viewable //
  _trackViewables(bindings) {
    const options = this._options && this._options.viewable;
    if (!options) {
      return;
    }
    for (const binding of bindings) {
      this._trackViewableOnElement(binding);
    }
  }

  async _trackViewableOnElement(binding) {
    const { value, element } = binding;
    if (!value || !isElement(element) || this._viewables.has(element)) {
      return;
    }
    // TODO: when element is replaced without proper unload...
    const state = this._states.get(value, VIEWABLE);
    if (state !== UNTRACKED) {
      return;
    }
    this._states.set(value, VIEWABLE, TRACKING);

    const { area, duration } = this._options && this._options.viewable;
    // abort signal
    const ac = new AbortController();
    const { signal } = ac;
    this._viewables.set(element, { ac });
    await whenViewable(element, { area, duration, signal });
    this._viewables.delete(element);
    this._trigger(VIEWABLE, [value], { bindings: [binding] });
  }

  _untrackViewableOnElement({ value, element }) {
    const viewable = this._viewables.get(element);
    if (!viewable) {
      return;
    }
    viewable.ac.abort();
    this._viewables.delete(element);
    const type = VIEWABLE;
    if (this._states.get(value, type) === TRACKING) {
      this._states.set(value, type, UNTRACKED);
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
    const binding = this._bindings.get(event.target);
    if (!binding) {
      return;
    }

    // TODO: refactor
    if (typeof options.validate === 'function') {
      if (!options.validate(event, binding)) {
        return;
      }
    } else if (!options.lenient) {
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
    this._trigger(CLICK, [binding.value], { bindings: [binding] });
  }



  _trigger(event, values, { manual = false, bindings } = {}) {
    validateEventType(event);

    if (!this._isActive()) {
      return;
    }

    // ignore already triggered
    values = this._states.untriggered(asArray(values), event);

    if (values.length === 0) {
      return;
    }
    this._states.set(values, event, TRIGGERED);
    this._events.emit(event, { event, values, manual, bindings });
  }

  destroy() {
    this._retireElement();
    this._retireStates();
    this._bindings._destroy();
    for (const unsubscribe of this._unsubscribes) {
      unsubscribe();
    }
    this._unsubscribes = [];
  }

}
