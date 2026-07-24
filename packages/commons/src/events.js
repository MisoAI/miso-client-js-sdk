import { delegateGetters } from './objects.js';
import { removeItem } from './arrays.js';

export default class EventEmitter {

  constructor({ target, error, replays = [] } = {}) {
    this._error = error || (e => console.error(e));
    if (!Array.isArray(replays)) {
      throw new Error(`Replays option must be an array of strings: ${replays}`);
    }
    this._executing = false;
    this._queue = [];
    this._replays = new Set(replays);
    this._namedCallbacks = {};
    this._unnamedCallbacks = [];
    this._pastEvents = {};
    target && this._injectSubscribeInterface(target);
  }

  emit(name, data, meta) {
    //console.log('emit', name, data, this._target);
    const event = { data, meta: { ...meta, name, ts: Date.now() } };
    this._queue.push(event);
    this._drain();

    if (this._shallStoreForReplay(name)) {
      (this._pastEvents[name] || (this._pastEvents[name] = [])).push(event);
    }
  }

  _drain() {
    if (this._executing) {
      return;
    }
    this._executing = true;
    try {
      while (this._queue.length > 0) {
        const event = this._queue.shift();
        if (!event) {
          continue;
        }
        this._run(event);
      }
    } finally {
      this._executing = false;
    }
  }

  _run(event) {
    const callbacks = this._namedCallbacks[event.meta.name];
    if (callbacks) {
      for (const callback of callbacks) {
        callback(event);
      }
    }
    for (const callback of this._unnamedCallbacks) {
      callback(event);
    }
  }

  on(name, callback) {
    this._checkName(name);
    this._checkCallback(callback);
    return this._on(name, this._wrapCallback(callback));
  }

  once(name) {
    this._checkName(name);
    const self = this;
    return new Promise((resolve, reject) => {
      const off = self._on(name, (event) => {
        setTimeout(() => off());
        try {
          resolve(event);
        } catch(e) {
          reject(e);
        }
      });
    });
  }

  clear() {
    this._namedCallbacks = {};
    this._unnamedCallbacks = [];
    this._pastEvents = {};
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

  _shallStoreForReplay(name) {
    return this._replays.has(name);
  }

  _wrapCallback(callback) {
    const self = this;
    return ({ data, meta }) => {
      try {
        callback(data, meta);
      } catch(e) {
        //self._error(new Error(`Error in callback of event '${meta.name}'`));
        self._error(e);
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
    if (name === '*') {
      for (const key in this._pastEvents) {
        this._pastEvents[key].forEach(wrappedCallback);
      }
    } else {
      this._pastEvents[name] && this._pastEvents[name].forEach(wrappedCallback);
    }
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

  // TODO: use constructor options
  _injectSubscribeInterface(target) {
    delegateGetters(target, this, ['on', 'once']);
  }

}
