import { removeArrayItem } from "./objects";

export default class EventEmitter {

  constructor({ debug, error, replay = false } = {}) {
    this._error = error || (e => console.error(e));
    this._debug = debug;
    if (typeof replay !== 'boolean' && !Array.isArray(replay)) {
      throw new Error(`Replay option value must be either a boolean or an array of strings: ${replay}`);
    }
    this._replay = replay;
    this._callbacks = {};
    this._pastEvents = {};
  }

  emit(name, data) {
    const event = { data };
    const callbacks = this._callbacks[name];
    if (callbacks) {
      for (const callback of callbacks) {
        callback(event);
      }
    }
    this._debug && this._debug(name, data);
    if (this._shallKeepInReplay(name)) {
      (this._pastEvents[name] || (this._pastEvents[name] = [])).push(event);
    }
  }

  on(name, callback) {
    this._checkName(name);
    this._checkCallback(callback);
    return this._on(name, this._wrapCallback(name, callback));
  }

  once(name, callback) {
    this._checkName(name);
    this._checkCallback(callback);
    const wrappedCallback = this._wrapCallback(name, callback);
    const off = this._on(name, (event) => {
      off();
      wrappedCallback(event);
    });
    return off;
  }

  // helper //
  _checkName(name) {
    if (typeof name !== 'string') {
      throw new Error(`Event name should be a string: ${name}`);
    }
  }

  _checkCallback(callback) {
    if (typeof callback !== 'function') {
      throw new Error(`Event callback should be a function: ${callback}`);
    }
  }

  _shallKeepInReplay(name) {
    return this._replay === true || (Array.isArray(this._replay) && this._replay.indexOf(name) > -1);
  }

  _wrapCallback(name, callback) {
    const self = this;
    return ({ data }) => {
      try {
        callback(data);
      } catch(e) {
        self._error(new Error(`Error in event callback of ${name}.`, { cause: e }));
      }
    };
  }

  _on(name, wrappedCallback) {
    (this._callbacks[name] || (this._callbacks[name] = [])).push(wrappedCallback);
    // if this event type is in replay mode, replay past events
    this._pastEvents[name] && this._pastEvents[name].forEach(wrappedCallback);
    // return the corresponding unsubscribe function
    return () => this._off(name, wrappedCallback);
  }

  _off(name, wrappedCallback) {
    const callbacks = this._callbacks[name];
    callbacks && removeArrayItem(callbacks, wrappedCallback);
  }

}
