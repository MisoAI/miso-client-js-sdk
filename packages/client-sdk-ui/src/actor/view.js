import { trimObj, defineValues, delegateGetters, EventEmitter } from '@miso.ai/commons';
import { STATUS, ROLE, isDataRole } from '../constants.js';
import * as fields from './fields.js';
import ProxyElement from '../util/proxy.js';
import Tracker from './tracker.js';

function statesEqual(a, b) {
  return a === b || (a && b &&
    a.status === b.status &&
    a.error === b.error &&
    a.value === b.value && // skip deep equals
    a.ongoing === b.ongoing &&
    sessionEquals(a.session, b.session));
}

function sessionEquals(a, b) {
  return a === b || (a && b && a.uuid === b.uuid);
}

export default class ViewActor {

  constructor(views, role) {
    this._events = new EventEmitter({ target: this });
    this._views = views;
    this._mapping = asMappingFunction((views._roles.mappings || {})[role] || role);

    defineValues(this, {
      role,
      interface: new View(this),
    });
  }

  get hub() {
    return this._views._hub;
  }

  get element() {
    return this._element;
  }

  set element(element) {
    if (element === this._element) {
      return;
    }
    if (this._element) {
      this._safeApplyOnLayout('unrender', this._element);
    }
    this._element = element;
    this._proxyElement && this._proxyElement.sync();
    this._events.emit('element', element);
    this.refresh({ force: true });
  }

  get proxyElement() {
    if (!this._proxyElement) {
      this._proxyElement = new ProxyElement(() => this.element);
    }
    return this._proxyElement;
  }

  get layout() {
    return this._layout;
  }

  set layout(layout) {
    if (layout === this._layout) {
      return;
    }
    if (layout && typeof layout.render !== 'function') {
      throw new Error(`Render function is mandatory in a layout.`);
    }

    // clean up old layout
    const { element } = this;
    element && this._safeApplyOnLayout('unrender', element);
    this._safeApplyOnLayout('destroy');

    this._layout = layout;

    // initialize new layout
    if (layout) {
      layout._view = this;
      // don't use _safeApplyOnLayout, for any error should be thrown
      if (typeof layout.initialize === 'function') {
        layout.initialize(this);
      }
    }

    // in case the data is already there
    this.refresh({ force: true });
  }

  get tracker() {
    const { role } = this;
    if (role === ROLE.CONTAINER) {
      return this._views._getContainerTracker();
    }
    // TODO: we should move this to workflow level, as there could be multiple view of the same role in the future
    if (!this._tracker) {
      const { hub } = this;
      this._tracker = new Tracker({ hub, role, options: () => this.trackerOptions });
    }
    return this._tracker;
  }
  
  get workflowOptions() {
    return this._views._options.resolved;
  }

  get trackerOptions() {
    return this._views._getTrackerOptions(this.role);
  }

  get filters() {
    return this._views.filters;
  }

  async refresh({ force = false, data } = {}) {
    // protocol: no reaction when layout is absent
    if (!this._layout) {
      return;
    }

    // nothing to do when element is absent
    const { element } = this;
    if (!element) {
      return;
    }

    // sync data
    const previousData = this._data;
    this._data = data = this._sliceData(data || this._views._getData());

    // if data is unchanged, skip unless forced
    if (!force && statesEqual(data, previousData)) {
      return;
    }

    const { session, status, ongoing, request, meta, value } = data;
    const baseState = { session, status, ongoing, request, meta, data: value, ...getDataEmptyness(data) };

    // render
    const notifyUpdate = (state = {}, options) => {
      state !== false && this.updateState({ ...baseState, ...state }, options);
    };
    try {
      await this._layout.render(element, data, { notifyUpdate });
    } catch(error) {
      this._error(error);
      notifyUpdate({ error });
    }
  }

  updateState(state, { silent = false } = {}) {
    // there might be error from notifyUpdate() call
    const status = state.error ? STATUS.ERRONEOUS : state.status;
    state = this._state = Object.freeze(trimObj({ ...state, status }));
    const { role } = this;
    this.hub.update(fields.view(role), state, { silent });
  }

  _sliceData(data) {
    const { value, error, status, meta, ...rest } = data;
    const sliced = {
      value: this._mapping(data, this),
      status,
      data: value,
      meta,
      ...rest,
    };
    if (this.role === ROLE.CONTAINER) {
      // pass empty/nonempty information
      sliced.meta = {
        ...meta,
        empty: this._isContainerEmpty(value),
      };
    }
    return trimObj(sliced);
  }

  _isContainerEmpty(value) {
    const { element } = this;
    if (!element) {
      return false;
    }
    // iterate over all member components' roles
    for (const { role } of element.components) {
      // not a data role -> irrelevant
      if (!isDataRole(role)) {
        continue;
      }
      let sliced = value && value[role];
      if (role === ROLE.QUERY_SUGGESTIONS) {
        // special case: query suggestions -> look up value from hub
        // TODO: adhoc
        const data = this.hub.states[fields.suggestions()];
        sliced = data && data.value;
      }
      if (sliced && sliced.length !== 0) {
        return false;
      }
    }
    return true;
  }

  _syncSize() {
    this._element && this._safeApplyOnLayout('syncSize', this._element);
  }

  _safeApplyOnLayout(method, ...args) {
    if (!this._layout || typeof this._layout[method] !== 'function') {
      return;
    }
    try {
      this._layout[method](...args);
    } catch(e) {
      this._error(e);
    }
  }

  _error(e) {
    this._views._error(e);
  }

  _destroy() {
    this._safeApplyOnLayout('destroy');
    this._proxyElement && this._proxyElement.destroy();
  }

}

class View {

  constructor(actor) {
    delegateGetters(this, actor, ['role', 'layout', 'element', 'proxyElement', 'refresh', 'on', 'tracker']);
  }

}

function asMappingFunction(fn) {
  switch (typeof fn) {
    case 'function':
      return fn;
    case 'string':
      return data => data.value && data.value[fn];
    default:
      throw new Error(`Invalid mapping function: ${fn}`);
  }
}

function getDataEmptyness(data) {
  return isDataStatusRelevantToEmptyness(data) ? { empty: !!isDateValueEmpty(data) } : {};
}

function isDataStatusRelevantToEmptyness(data) {
  return data.status === STATUS.READY && !data.ongoing;
}

function isDateValueEmpty(data) {
  const { value } = data;
  return value === undefined || ((Array.isArray(value) || typeof value === 'string') && !value.length);
}
