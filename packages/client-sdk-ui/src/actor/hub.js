import { defineValues, EventEmitter } from '@miso.ai/commons';
import { removeDataInstructions } from '../workflow/processors.js';

export default class Hub {

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
    this._states[name] = Object.freeze(removeDataInstructions(state));
    if (!silent) {
      this._events.emit(name, state);
    }
  }

  trigger(name, event) {
    this._events.emit(name, event);
  }

}
