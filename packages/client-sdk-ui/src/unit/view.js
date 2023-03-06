import { VIEW_STATUS } from '../constants';

function getState(unit) {
  const { active, session, data, dataError: error } = unit;
  const status = error ? VIEW_STATUS.ERRONEOUS : data ? VIEW_STATUS.READY : active ? VIEW_STATUS.LOADING : VIEW_STATUS.INITIAL;
  return { status, error, data, session };
}

function equalStates(a, b) {
  return (!a && !b) || (a && b &&
    a.status === b.status &&
    a.error === b.error &&
    a.data === b.data && // skip deep equals
    (a.session && a.session.uuid) === (b.session && b.session.uuid));
}

export default class ViewReactor {

  constructor(unit) {
    this._unit = unit;

    this._unsubscribes = [
      unit.on('unbind', element => this._layout.unrender(element)),
      unit.on('bind', () => this.refresh()),
      unit.on('reset', () => this.refresh()),
      unit.on('start', () => this.refresh()),
      unit.on('data', () => this.refresh()),
    ];
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
    const { element } = this._unit;
    element && this._safeApplySync('unrender', element);
    this._safeApplySync('destroy');

    // initialize new layout
    this._layout = layout;

    if (layout && typeof layout.initialize === 'function') {
      layout.initialize(this._unit);
    }

    // in case the data is already there
    this.refresh({ force: true });
  }

  async refresh({ force } = {}) {
    if (!this._layout) {
      return;
    }

    const unit = this._unit;
    const { element, active } = unit;
    if (!element || !active) {
      return;
    }

    const oldState = this._state;
    const state = getState(unit);
    if (!force && equalStates(state, oldState)) {
      return;
    }
    this._state = state;

    let aborted = false;
    let erroneous = false;
    function abort() {
      aborted = true;
    }
    try {
      await this._layout.render(element, state, { abort, oldState });
    } catch(e) {
      this._error(e);
      erroneous = true;
    }
    if (!aborted) {
      unit.notifyViewUpdate(erroneous ? { ...state, erroneous: true } : state);
    }
  }

  _handleUnbind(element) {
    this._safeApplySync('unrender', element);
  }

  _safeApplySync(method, ...args) {
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
    // TODO
    console.error(e);
  }

  _destroy() {
    if (typeof this._layout.destroy === 'function') {
      try {
        this._layout.destroy();
      } catch(e) {
        // TODO
        console.error(e);
      }
    }
    for (const unsubscribe of this._unsubscribes) {
      unsubscribe();
    }
  }

}
