import { defineValues, requestAnimationFrame as raf, capture } from '@miso.ai/commons';

export default class RafLayout {

  constructor({ role, ...options } = {}) {
    defineValues(this, { role, options });
    this._unsubscribes = [];
    this._rendered = new WeakMap();
    this._element = undefined;
    this._notifyUpdate = undefined;
    this._pending = undefined;
  }

  async render(element, state, controls = {}) {
    this._syncElement(element);

    const rendered = this._rendered.get(element);
    const skip = capture(false);

    // can do some pre-processing here to reducing time cost within RAF
    state = this._preprocess({ state, rendered }, { skip: skip.t }) || state;
    this._updatePending(state, controls);

    // TODO: shall we put this inside _handleInput?
    if (!skip.value) {
      this._handleInput({ state, rendered }, controls);
    }
  }

  _syncElement(element) {
    if (this._element !== element) {
      // clean up state on old element even thought it's a weak reference,
      // for we have no idea what will happen to it
      this._rendered.delete(this._element);
    }
    this._element = element;
  }

  _preprocess({ state }) {
    return state;
  }

  _updatePending(state, controls) {
    this._pending = [Object.freeze(state), controls];
  }

  _takePending() {
    const pending = this._pending;
    this._pending = undefined;
    return pending;
  }

  _handleInput() {
    this._requestRaf();
  }

  _requestRaf() {
    if (this._requested) {
      return;
    }
    this._requested = true;
    raf(() => this._doRaf());
  }

  _doRaf() {
    if (!this._requested) {
      return; // just in case
    }
    this._requested = false;
    this._applyRender();
  }

  _applyRender(extraControls = {}) {
    if (!this._pending) {
      return; // just in case
    }
    const timestamp = Date.now();
    let [state, { notifyUpdate }] = this._takePending();
    state = Object.freeze({ ...state, timestamp });

    const rendered = this._rendered.get(this._element);
    const argsForNotifyUpdate = capture([]);
    const stateExtra = capture({});

    this._render(this._element, { state, rendered, timestamp }, { notifyUpdate: argsForNotifyUpdate.args, writeToState: stateExtra.merge, ...extraControls });

    this._rendered.set(this._element, Object.freeze({ ...state, ...stateExtra.value }));

    notifyUpdate && notifyUpdate(...argsForNotifyUpdate.value);
  }

  _render() {
    throw new Error('Unimplemented');
  }

  destroy() {
    for (const unsubscribe of this._unsubscribes) {
      unsubscribe();
    }
    this._unsubscribes = [];
    this._element = undefined;
    this._notifyUpdate = undefined;
    this._pending = undefined;
  }

}
