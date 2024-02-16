import { EventEmitter, defineValues, asArray, trimObj } from '@miso.ai/commons';
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

export function normalizeLayoutsOptions(options = {}) {
  if (options === false) {
    return false;
  }
  // fallback: results -> products
  const { [ROLE.RESULTS]: results, ...rest } = options;
  if (results !== undefined) {
    console.warn(`useLayouts({ ${[ROLE.RESULTS]}: ... }) is deprecated, use useLayouts({ ${[ROLE.PRODUCTS]}: ... }) instead`);
    options = { ...rest, [ROLE.PRODUCTS]: results };
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

export function normalizeDataProcessorOptions(fns) {
  fns = asArray(fns);
  for (const fn of fns) {
    if (typeof fn !== 'function') {
      throw new Error(`Expect data processor options to be a function: ${fn}`);
    }
  }
  return fns;
}

export function normalizeTrackers(options) {
  if (options === undefined || options === false) {
    return options;
  }
  const normalized = {};
  for (const [role, args] of Object.entries(options)) {
    normalized[role] = normalizeTrackerOptions(args);
  }
  return normalized;
}

function normalizeTrackerOptions(options) {
  return options;
}

export function normalizeInteractionsOptions(options) {
  if (options === undefined) {
    return undefined;
  }
  if (options === false) {
    return {
      handle: () => {},
    };
  }
  // preprocess
  const preprocess = asArray(options.preprocess);
  for (const p of preprocess) {
    if (typeof p !== 'function') {
      throw new Error(`Expect preprocess options to be a function: ${p}`);
    }
  }
  // handle
  if (options.handle && typeof options.handle !== 'function') {
    throw new Error(`Expect handle options to be a function: ${options.handle}`);
  }
  return { ...options, preprocess };
}

// merge //
export function mergeApiOptions(...optionsList) {
  if (optionsList[optionsList.length - 1] === false) {
    return false;
  }
  return mergeOptions(optionsList, (merged, options) => Object.assign(merged, {
    ...options,
    payload: mergeApiPayloads(merged.payload, options.payload),
  }));
}

function mergeApiPayloads(base, overrides) {
  return {
    ...base,
    ...overrides,
    ...mergeObjectValueIfPresent('_meta', base, overrides),
  };
}

function mergeObjectValueIfPresent(key, base, overrides) {
  const baseValue = base && base[key];
  const overridesValue = overrides && overrides[key];
  const value = baseValue ? (overridesValue ? { ...baseValue, ...overridesValue } : baseValue) : overridesValue;
  return value !== undefined ? { [key]: value } : {};
}

export function mergeLayoutsOptions(...optionsList) {
  if (optionsList[optionsList.length - 1] === false) {
    return false;
  }
  return mergeOptions(optionsList, (merged, options) => {
    for (const [role, args] of Object.entries(options)) {
      merged[role] = mergeLayoutOptions(merged[role], args);
    }
    return merged;
  });
}

function mergeLayoutOptions(base, overrides) {
  overrides = normalizeLayoutOptions(overrides);
  if (overrides[0] === false) {
    return overrides;
  }
  return base && overrides ? [overrides[0] || base[0], mergeLayoutParameters(base[1], overrides[1])] : (overrides || base);
}

function mergeLayoutParameters(base, overrides) {
  return {
    ...base,
    ...overrides,
    link: { ...(base && base.link), ...(overrides && overrides.link) },
    templates: { ...(base && base.templates), ...(overrides && overrides.templates) },
  };
}

export function mergeDataProcessorOptions(...optionsList) {
  return optionsList.flat().filter(Boolean);
}

export function mergeTrackersOptions(...optionsList) {
  if (optionsList[optionsList.length - 1] === false) {
    return false;
  }
  return mergeOptions(optionsList, (merged, options) => Object.assign(merged, {
    ...options,
    impression: mergeTrackerEventOptions(merged.impression, options.impression),
    viewable: mergeTrackerEventOptions(merged.viewable, options.viewable),
    click: mergeTrackerEventOptions(merged.click, options.click),
  }));
}

function mergeTrackerEventOptions(base = {}, overrides = {}) {
  return (overrides === false || base === false) ? overrides : { ...base, ...overrides };
}

export function mergeInteractionsOptions(...optionsList) {
  if (optionsList[optionsList.length - 1] === false) {
    return false;
  }
  return mergeOptions(optionsList, (merged, options) => Object.assign(merged, {
    ...options,
    preprocess: concatArrays(merged.preprocess, options.preprocess),
  }));
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
  {
    key: 'dataProcessor',
    normalize: normalizeDataProcessorOptions,
    merge: mergeDataProcessorOptions,
  },
  {
    key: 'trackers',
    normalize: normalizeTrackerOptions,
    merge: mergeTrackersOptions,
  },
  {
    key: 'interactions',
    normalize: normalizeInteractionsOptions,
    merge: mergeInteractionsOptions,
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
    this._defaults = defaults;
    this._globals = globals || {};
    this._locals = {};

    defineValues(this, {
      resolved: new ResolvedWorkflowOptions(this),
      defaults,
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

// helpers //
function concatArrays(a0, a1) {
  return (a0 && a0.length) ? (a1 && a1.length) ? [...a0, ...a1] : a0 : a1;
}

function mergeOptions(optionsList, merge) {
  let merged = {};
  for (const options of optionsList) {
    if (!options) {
      continue;
    }
    merged = merge(merged, options);
  }
  return trimObj(merged);
}
