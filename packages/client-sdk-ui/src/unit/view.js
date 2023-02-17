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
      unit.on('unbind', element => this._widget.unrender(element)),
      unit.on('bind', () => this.refresh()),
      unit.on('reset', () => this.refresh()),
      unit.on('start', () => this.refresh()),
      unit.on('data', () => this.refresh()),
    ];
  }

  get widget() {
    return this._widget;
  }

  set widget(widget) {
    if (widget === this._widget) {
      return;
    }
    if (widget && typeof widget.render !== 'function') {
      throw new Error(`Render function is mandatory in a widget.`);
    }

    // clean up old widget
    const { element } = this._unit;
    element && this._safeApplySync('unrender', element);
    this._safeApplySync('destroy');

    // initialize new widget
    this._widget = widget;

    if (widget && typeof widget.initialize === 'function') {
      widget.initialize(this._unit);
    }

    // in case the data is already there
    this.refresh({ force: true });
  }

  async refresh({ force } = {}) {
    if (!this._widget) {
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
      await this._widget.render(element, state, { abort, oldState });
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
    if (!this._widget || typeof this._widget[method] !== 'function') {
      return;
    }
    try {
      this._widget[method](...args);
    } catch(e) {
      this._error(e);
    }
  }

  _error(e) {
    // TODO
    console.error(e);
  }

  _destroy() {
    if (typeof this._widget.destroy === 'function') {
      try {
        this._widget.destroy();
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
