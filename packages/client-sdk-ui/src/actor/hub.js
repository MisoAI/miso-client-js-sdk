import { defineValues, EventEmitter } from '@miso.ai/commons';

export default class Hub {

  constructor(options = {}) {
    (this._events = new EventEmitter())._injectSubscribeInterface(this);
    this._options = options;
    this._states = {};
    defineValues(this, {
      states: new Proxy(this._states, {
        set() {}
      }),
    });
  }

  update(name, state, options = {}) {
    this._states[name] = Object.freeze(state);
    const event = Object.freeze({ action: 'update', name, state, ...options });
    // callback after update, before emit
    if (typeof this._options.onUpdate === 'function') {
      this._options.onUpdate(event);
    }
    // emit
    if (!options.silent) {
      this._events.emit(name, state);
    }
    // callback after emit
    if (typeof this._options.onEmit === 'function') {
      this._options.onEmit(event);
    }
  }

  trigger(name, state) {
    const event = Object.freeze({ action: 'trigger', name, state });
    // callback before emit
    if (typeof this._options.onUpdate === 'function') {
      this._options.onUpdate(event);
    }
    // emit
    this._events.emit(name, state);
    // callback after emit
    if (typeof this._options.onEmit === 'function') {
      this._options.onEmit(event);
    }
  }

}
