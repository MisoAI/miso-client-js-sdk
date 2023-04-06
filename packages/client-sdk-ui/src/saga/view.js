import { trimObj, defineValues } from '@miso.ai/commons';
import { STATUS } from '../constants';
import * as fields from './fields';

function statesEqual(a, b) {
  return a === b || (a && b &&
    a.status === b.status &&
    a.error === b.error &&
    a.value === b.value && // skip deep equals
    sessionEquals(a.session, b.session));
}

function sessionEquals(a, b) {
  return a === b || (a && b && a.uuid === b.uuid);
}

export default class ViewReactor {

  constructor(views, role) {
    this._views = views;
    defineValues(this, {
      role,
    });
    this._unsubscribes = [
      this.saga.elements.on(role, () => this.refresh()),
    ];
  }

  get saga() {
    return this._views._saga;
  }

  get element() {
    return this._element;
  }

  get proxyElement() {
    return this.saga.elements.proxy(this.role);
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
    const element = this._getElement();
    element && this._safeApplyOnLayout('unrender', element);
    this._safeApplyOnLayout('destroy');

    this._layout = layout;

    // initialize new layout
    // don't use _safeApplyOnLayout for any error should be thrown
    if (layout && typeof layout.initialize === 'function') {
      layout.initialize(this.saga); // TODO: pass this
    }

    // in case the data is already there
    this.refresh({ force: true });
  }

  async refresh({ force = false, data } = {}) {
    // protocol: no reaction when layout is absent
    if (!this._layout) {
      return;
    }

    this._syncElement();

    // nothing to do when element is absent
    const { element } = this;
    if (!element) {
      return;
    }

    // sync data
    const previousData = this._data;
    this._data = data = this._sliceData(data || this._views._getData());

    // protocol: no reaction until session starts
    const { session } = data;
    const active = session && session.active;
    if (!active) {
      return;
    }

    // if data is unchanged, skip unless forced
    if (!force && statesEqual(data, previousData)) {
      return;
    }

    // render
    let omitted = false;
    let error;
    function omit() {
      omitted = true;
    }
    try {
      await this._layout.render(element, data, { omit, previous: previousData });
    } catch(e) {
      this._error(e);
      error = e;
    }

    // update view state
    const status = error ? STATUS.ERRONEOUS : STATUS.READY;
    const state = this._state = Object.freeze(trimObj({ session, status, error }));

    if (!omitted) {
      const { role } = this;
      this.saga.update(fields.view(role), state);
      this.saga.trigger(fields.view(), { role, state });
    }
  }

  _sliceData(data) {
    const { value, ...rest } = data;
    return trimObj({ value: value && value[this.role], ...rest });
  }

  _getElement() {
    return this.saga.elements.get(this.role);
  }

  _syncElement() {
    const element = this._getElement();
    if (this._element && this._element !== element) {
      this._safeApplyOnLayout('unrender', this._element);
    }
    this._element = element;
  }

  _syncSize() {
    const element = this._getElement();
    element && this._safeApplyOnLayout('syncSize', element);
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
    for (const unsubscribe of this._unsubscribes) {
      unsubscribe();
    }
    this._unsubscribes = [];
    this._safeApplyOnLayout('destroy');
  }

}
