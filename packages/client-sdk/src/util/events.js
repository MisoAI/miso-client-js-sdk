import { arrayRemoveItem } from "./objects";

export default class EventEmitter {

  constructor({ debug, error } = {}) {
    this._error = error || (e => console.error(e));
    this._debug = debug;
    this._handlers = {};
  }

  emit(name) {
    const handlers = this._handlers[name];
    if (handlers) {
      for (const handler of handlers) {
        handler.apply(undefined, Array.prototype.slice.call(arguments, 1));
      }
    }
    this._debug && this._debug.apply(undefined, arguments);
  }

  on(name, handler) {
    this._checkName(name);
    this._checkHandler(handler);
    return this._on(name, this._wrapHandler(name, handler));
  }

  once(name, handler) {
    this._checkName(name);
    this._checkHandler(handler);
    const wrappedHandler = this._wrapHandler(name, handler);
    const off = this._on(name, () => {
      wrappedHandler.apply(undefined, arguments);
      off();
    });
    return off;
  }

  // helper //
  _checkName(name) {
    if (typeof name !== 'string') {
      throw new Error(`Event name should be a string: ${name}`);
    }
  }

  _checkHandler(handler) {
    if (typeof handler !== 'function') {
      throw new Error(`Event handler should be a function: ${handler}`);
    }
  }

  _wrapHandler(name, handler) {
    const self = this;
    return () => {
      try {
        handler.apply(undefined, arguments);
      } catch(e) {
        self._error(new Error(`Error in event handler of ${name}.`, { cause: e }));
      }
    };
  }

  _on(name, wrappedHandler) {
    const handlers = this._handlers[name] || (this._handlers[name] = []);
    handlers.push(wrappedHandler);
    // return the corresponding unsubscribe function
    return () => this._off(name, wrappedHandler);
  }

  _off(name, wrappedHandler) {
    const handlers = this._handlers[name];
    handlers && arrayRemoveItem(handlers, wrappedHandler);
  }

}
