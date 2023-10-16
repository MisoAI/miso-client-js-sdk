import { EventEmitter, asArray, trimObj } from '@miso.ai/commons';
import { ROLE } from '../constants.js';

// normalize //
export function normalizeApiOptions([name, payload] = []) {
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

export function normalizeLayoutsOptions({ [ROLE.RESULTS]: results, ...options } = {}) {
  // fallback
  if (results !== undefined) {
    console.warn(`useLayouts({ ${[ROLE.RESULTS]}: ... }) is deprecated, use useLayouts({ ${[ROLE.PRODUCTS]}: ... }) instead`);
    options[ROLE.PRODUCTS] = results;
  }
  const normalize = {};
  for (const [role, args] of Object.entries(options)) {
    normalize[role] = normalizeLayoutOptions(args);
  }
  return normalize;
}

function normalizeLayoutOptions(args) {
  // take args:
  // * undefined
  // * false
  // * name (string)
  // * options (object)
  // * [name, options]
  if (args === undefined) {
    return undefined;
  }
  let [name, options] = asArray(args);
  if (typeof name === 'object') {
    options = name;
    name = undefined;
  }
  return [name, options];
}

// merge //
export function mergeApiOptions(...optionsList) {
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

export function mergeLayoutsOptions(...optionsList) {
  if (optionsList[optionsList.length - 1] === false) {
    return false;
  }
  let merged = {};
  for (const options of optionsList) {
    if (!options) {
      continue;
    }
    for (const [role, args] of Object.entries(options)) {
      merged[role] = mergeLayoutOptions(merged[role], args);
    }
  }
  return merged;
}

function mergeLayoutOptions(base, overrides) {
  overrides = normalizeLayoutOptions(overrides);
  return base && overrides ? [overrides[0] || base[0], { ...base[1], ...overrides[1] }] : (overrides || base);
}

// manifest //
const FEATURES = [
  {
    key: 'api',
    normalize: normalizeApiOptions,
    merge: mergeApiOptions,
  },
  {
    key: 'layouts',
    normalize: normalizeLayoutsOptions,
    merge: mergeLayoutsOptions,
  },
];



export class WorkflowContextOptions {

  constructor() {
    this._events = new EventEmitter({ target: this });
    this._globals = {};
  }

  _notify(name) {
    this._events.emit(name, { name, value: this[name] });
  }

}

export class WorkflowOptions {

  constructor(globals = {}, defaults = {}) {
    this._events = new EventEmitter({ target: this });
    this._defaults = defaults; // TODO: expose defaults
    this._globals = globals || {};
    this._locals = {};

    Object.defineProperty(this, 'resolved', {
      value: new ResolvedWorkflowOptions(this),
    });

    if (globals && globals.on) {
      this._unsubscribes = [
        globals.on('*', event => this._notify(event.name)),
      ];
    }
  }

  _notify(name) {
    this._events.emit(name, { name, value: this.resolved[name] });
  }

  _destroy() {
    for (const unsubscribe of this._unsubscribes || []) {
      unsubscribe();
    }
    this._unsubscribes = [];
  }

}

class ResolvedWorkflowOptions {

  constructor(options) {
    this._options = options;
  }

}

for (const { key, normalize, merge } of FEATURES) {
  Object.defineProperty(WorkflowContextOptions.prototype, key, {
    set: function(value) {
      this._globals[key] = normalize(value);
      this._notify(key);
    },
    get: function() {
      return this._globals[key];
    },
  });
  Object.defineProperty(WorkflowOptions.prototype, key, {
    set: function(value) {
      this._locals[key] = normalize(value);
      this._notify(key);
    },
    get: function() {
      return this._locals[key];
    },
  });
  Object.defineProperty(ResolvedWorkflowOptions.prototype, key, {
    get: function() {
      const options = this._options;
      return merge(options._defaults[key], options._globals[key], options._locals[key]);
    },
  });
}
