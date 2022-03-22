import { removeArrayItem } from "./objects";

export default class EventEmitter {

  constructor({ debug, error } = {}) {
    this._error = error || (e => console.error(e));
    this._debug = debug;
    this._callbacks = {};
  }

  emit(name) {
    const callbacks = this._callbacks[name];
    const restArgs = Array.prototype.slice.call(arguments, 1);
    if (callbacks) {
      for (const callback of callbacks) {
        callback(restArgs);
      }
    }
    this._debug && this._debug.apply(undefined, Array.prototype.slice.call(arguments));
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
    const off = this._on(name, (args) => {
      off();
      wrappedCallback(args);
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

  _wrapCallback(name, callback) {
    const self = this;
    return (args) => {
      try {
        callback.apply(undefined, args);
      } catch(e) {
        self._error(new Error(`Error in event callback of ${name}.`, { cause: e }));
      }
    };
  }

  _on(name, wrappedCallback) {
    const callbacks = this._callbacks[name] || (this._callbacks[name] = []);
    callbacks.push(wrappedCallback);
    // return the corresponding unsubscribe function
    return () => this._off(name, wrappedCallback);
  }

  _off(name, wrappedCallback) {
    const callbacks = this._callbacks[name];
    callbacks && removeArrayItem(callbacks, wrappedCallback);
  }

}
