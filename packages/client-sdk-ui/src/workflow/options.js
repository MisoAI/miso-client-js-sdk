import { EventEmitter, trimObj } from '@miso.ai/commons';

// normalization //
export function normalizeApiOptions(name, payload) {
  if (name === false) {
    return { actor: false };
  }
  if (typeof name === 'object' && payload === undefined) {
    payload = name;
    name = undefined;
  }
  if ((name && typeof name !== 'string') || (payload !== undefined && typeof payload !== 'object')) {
    throw new Error(`Invalid arguments for useApi(): ${name}, ${payload}`);
  }
  return trimObj({ name, payload });
}

// merge //
export function mergeApi(...optionsList) {
  if (optionsList[optionsList.length - 1] === false) {
    return false;
  }
  let merged = {};
  for (const options of optionsList) {
    if (!options) {
      continue;
    }
    Object.assign(merged, {
      ...options,
      payload: {
        ...merged.payload,
        ...options.payload,
      },
    });
  }
  return merged;
}



export class WorkflowContextOptions {

  constructor() {
    this._events = new EventEmitter({ target: this });
    this._globals = {};
  }

  _notify(name) {
    this._events.emit(name, { name, value: this[name] });
  }

}

for (const name of ['api']) {
  Object.defineProperty(WorkflowContextOptions.prototype, name, {
    set: function(value) {
      this._globals[name] = value;
      this._notify(name);
    },
    get: function() {
      return this._globals[name];
    },
  });
}

export class WorkflowOptions {

  constructor(globals = {}, defaults = {}) {
    this._events = new EventEmitter({ target: this });
    this._defaults = defaults;
    this._globals = globals || {};
    this._locals = {};

    if (globals && globals.on) {
      this._unsubscribes = [
        globals.on('*', event => this._events.emit(event.name, event)),
      ];
    }
  }

  set api(value) {
    this._locals.api = value;
    this._notify('api');
  }

  get api() {
    return mergeApi(this._defaults.api, this._globals.api, this._locals.api);
  }

  _notify(name) {
    this._events.emit(name, { name, value: this[name] });
  }

  _destroy() {
    for (const unsubscribe of this._unsubscribes || []) {
      unsubscribe();
    }
    this._unsubscribes = [];
  }

}
