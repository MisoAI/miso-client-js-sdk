import { defineValues, EventEmitter } from '@miso.ai/commons';

export default class Saga {

  constructor() {
    (this._events = new EventEmitter())._injectSubscribeInterface(this);
    this._states = {};
    defineValues(this, {
      states: new Proxy(this._states, {
        set() {}
      }),
    });
  }

  update(name, state, { silent = false } = {}) {
    this._states[name] = Object.freeze(state);
    if (!silent) {
      this._events.emit(name, state);
    }
  }

  trigger(name, event) {
    this._events.emit(name, event);
  }

}
