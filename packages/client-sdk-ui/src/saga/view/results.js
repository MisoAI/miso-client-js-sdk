import { trimObj } from '@miso.ai/commons';
import { STATUS } from '../../constants';

function statesEqual(a, b) {
  return (!a && !b) || (a && b &&
    a.status === b.status &&
    a.error === b.error &&
    a.value === b.value && // skip deep equals
    sessionEquals(a.session, b.session));
}

function sessionEquals(a, b) {
  return (!a && !b) || (a && b && a.uuid === b.uuid);
}

export default class ResultsViewReactor {

  constructor(saga) {
    this._saga = saga;

    this._unsubscribes = [
      saga.elements.on('results', () => this.refresh()),
      saga.on('data', () => this.refresh()),
    ];

    this._trySyncSize = this._onWindowResize.bind(this);
    window.addEventListener('resize', this._onWindowResize);
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
    const element = this._saga.elements.get('results');
    element && this._safeApplyOnLayout('unrender', element);
    this._safeApplyOnLayout('destroy');

    // initialize new layout
    this._layout = layout;

    if (layout && typeof layout.initialize === 'function') {
      layout.initialize(this._saga);
    }

    // in case the data is already there
    this.refresh({ force: true });
  }

  get element() {
    return this._element;
  }

  get state() {
    return this._state;
  }

  async refresh({ force } = {}) {
    if (!this._layout) {
      return;
    }

    const element = this._saga.elements.get('results');
    if (this._element && this._element !== element) {
      this._safeApplyOnLayout('unrender', this._element);
    }
    if (!element) {
      return;
    }
    this._element = element;

    const previousData = this._data;
    const data = this._getRenderInput();
    const active = data.session && data.session.active;
    if (!active) {
      return;
    }
    if (!force && statesEqual(data, previousData)) {
      return;
    }
    this._data = data;

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
    this._state = Object.freeze(trimObj({
      session: data.session,
      status: error ? STATUS.ERRONEOUS : STATUS.READY,
      error,
    }));
    if (!omitted) {
      this._saga.update('view', this._state);
    }
  }

  _getRenderInput() {
    const { data } = this._saga.states;
    const status = (!data || !data.session || !data.session.active) ? STATUS.INITIAL :
      data.error ? STATUS.ERRONEOUS : data.value ? STATUS.READY : STATUS.LOADING;
    return Object.freeze({ ...data, status });
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

  _onWindowResize() {
    const element = this._saga.elements.get('results');
    element && this._safeApplyOnLayout('syncSize', element);
  }

  _error(e) {
    // TODO: saga trigger error event
    console.error(e);
  }

  destroy() {
    this._safeApplyOnLayout('destroy');
    for (const unsubscribe of this._unsubscribes) {
      unsubscribe();
    }
    this._unsubscribes = [];
    window.removeEventListener('resize', this._onWindowResize);
  }

}
