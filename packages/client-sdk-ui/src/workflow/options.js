import { EventEmitter, defineValues, asArray, trimObj, lowerCamelToSnake, kebabToSnake } from '@miso.ai/commons';
import { ROLE } from '../constants.js';

// normalize //
export function normalizeApiOptions([name, payload] = []) {
  // TODO: take object form as well
  if (name === false) {
    return { actor: false };
  }
  if (typeof name === 'object' && payload === undefined) {
    payload = name;
    name = undefined;
  }
  let group = undefined;
  if (name && name.indexOf('/') !== -1) {
    [group, name] = name.split('/');
  }
  if ((name && typeof name !== 'string') || (payload !== undefined && typeof payload !== 'object')) {
    throw new Error(`Invalid arguments for useApi(): ${name}, ${payload}`);
  }
  return trimObj({ group, name, payload });
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
    normalize[normalizeRole(role)] = normalizeLayoutOptions(args);
  }
  return normalize;
}

function normalizeRole(role) {
  role = lowerCamelToSnake(role);
  role = kebabToSnake(role);
  return role;
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

export function normalizeAutocompleteOptions(options) {
  if (options === undefined) {
    throw new Error(`Expect autocomplete options to be an object or a boolean value: ${options}`);
  }
  if (typeof options === 'boolean') {
    options = { actor: options };
  }
  const processData = normalizeDataProcessorOptions(options.processData);
  return { ...options, processData };
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

export function mergeAutocompleteOptions(...optionsList) {
  if (optionsList[optionsList.length - 1] === false) {
    return false;
  }
  return mergeOptions(optionsList, (merged, options) => Object.assign(merged, {
    ...options,
    api: mergeApiOptions(merged.api, options.api),
    processData: mergeDataProcessorOptions(merged.processData, options.processData),
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
  {
    key: 'autocomplete',
    normalize: normalizeAutocompleteOptions,
    merge: mergeAutocompleteOptions,
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

  constructor(context = {}, defaults = {}) {
    this._events = new EventEmitter({ target: this });
    this._defaults = defaults;
    this._context = context || {};
    this._locals = {};

    defineValues(this, {
      resolved: new ResolvedWorkflowOptions(this),
      defaults,
    });

    if (context && context.on) {
      this._unsubscribes = [
        context.on('*', event => this._notify(event.name)),
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

class WorkflowFeature {

  constructor(options, store, key, normalize, merge) {
    this._options = options;
    this._store = store;
    this._key = key;
    this._normalize = value => value !== undefined ? normalize(value) : undefined;
    this._merge = merge;
  }

  get() {
    return this._store[this._key];
  }

  set(value) {
    this._set(this._normalize(value));
  }

  merge(value) {
    this._set(this._merge(this.get(), this._normalize(value)));
  }

  _set(value) {
    this._store[this._key] = value;
    this._options._notify(this._key);
  }

}

class ResolvedWorkflowOptions {

  constructor(options) {
    this._options = options;
  }

}

for (const { key, normalize, merge } of FEATURES) {
  Object.defineProperty(WorkflowContextOptions.prototype, key, {
    get: function() {
      const _key = `_${key}`;
      return this[_key] || (this[_key] = new WorkflowFeature(this, this._globals, key, normalize, merge));
    },
  });
  Object.defineProperty(WorkflowOptions.prototype, key, {
    get: function() {
      const _key = `_${key}`;
      return this[_key] || (this[_key] = new WorkflowFeature(this, this._locals, key, normalize, merge));
    },
  });
  Object.defineProperty(ResolvedWorkflowOptions.prototype, key, {
    get: function() {
      const options = this._options;
      const contextFeature = options._context[key];
      return merge(options._defaults[key], contextFeature && contextFeature.get(), options._locals[key]);
    },
  });
}

const DEFAULT_FEATURES = ['api', 'layouts', 'dataProcessor', 'trackers', 'interactions'];

export function makeConfigurable(prototype, features = DEFAULT_FEATURES) {
  for (const feature of features) {
    injectConfigurableFeature(prototype, feature);
  }
}

function injectConfigurableFeature(prototype, feature) {
  if (feature === 'api') {
    Object.assign(prototype, {
      useApi(...args) {
        this._options.api.merge(args);
        return this;
      },
      clearApi() {
        this._options.api.set();
        return this;
      },
    });
  } else {
    const upperCased = upperCase(feature);
    Object.assign(prototype, {
      [`use${upperCased}`](value) {
        (this._options[feature]).merge(value);
        return this;
      },
      [`clear${upperCased}`]() {
        (this._options[feature]).set();
        return this;
      },
    });
  }
}



// helpers //
function upperCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

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
