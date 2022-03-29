import { removeItem } from "./arrays";

export default class EventEmitter {

  constructor({ error, replay = false } = {}) {
    this._error = error || (e => console.error(e));
    if (typeof replay !== 'boolean' && !Array.isArray(replay)) {
      throw new Error(`Replay option value must be either a boolean or an array of strings: ${replay}`);
    }
    this._replay = replay;
    this._namedCallbacks = {};
    this._unnamedCallbacks = [];
    this._pastEvents = {};
  }

  emit(name, data) {
    const event = { data, meta: { name, ts: Date.now() } };
    const callbacks = this._namedCallbacks[name];
    if (callbacks) {
      for (const callback of callbacks) {
        callback(event);
      }
    }
    for (const callback of this._unnamedCallbacks) {
      callback(event);
    }
    if (this._shallKeepInReplay(name)) {
      (this._pastEvents[name] || (this._pastEvents[name] = [])).push(event);
    }
  }

  on(name, callback) {
    this._checkName(name);
    this._checkCallback(callback);
    return this._on(name, this._wrapCallback(callback));
  }

  once(name, callback) {
    this._checkName(name);
    this._checkCallback(callback);
    const wrappedCallback = this._wrapCallback(callback);
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

  _wrapCallback(callback) {
    const self = this;
    return ({ data, meta }) => {
      try {
        callback(data, meta);
      } catch(e) {
        self._error(new Error(`Error in callback of event '${meta.name}': ${e.message}`, { cause: e }));
      }
    };
  }

  _on(name, wrappedCallback) {
    if (name === '*') {
      this._unnamedCallbacks.push(wrappedCallback);
    } else {
      (this._namedCallbacks[name] || (this._namedCallbacks[name] = [])).push(wrappedCallback);
    }
    // if this event type is in replay mode, replay past events
    this._pastEvents[name] && this._pastEvents[name].forEach(wrappedCallback);
    // return the corresponding unsubscribe function
    return () => this._off(name, wrappedCallback);
  }

  _off(name, wrappedCallback) {
    if (name === '*') {
      removeItem(this._unnamedCallbacks, wrappedCallback);
    } else {
      const callbacks = this._namedCallbacks[name];
      callbacks && removeItem(callbacks, wrappedCallback);
    }
  }

}
