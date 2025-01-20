import { EventEmitter, defineValues } from '@miso.ai/commons';
import { WORKFLOW_CONFIGURABLE } from '../../constants.js';
import { normalizeApiOptions, mergeApiOptions } from './api.js';
import { normalizeLayoutsOptions, mergeLayoutsOptions } from './layouts.js';
import { normalizeDataProcessorOptions, mergeDataProcessorOptions } from './data-processor.js';
import { normalizeTrackersOptions, mergeTrackersOptions } from './trackers.js';
import { normalizeInteractionsOptions, mergeInteractionsOptions } from './interactions.js';
import { normalizePaginationOptions, mergePaginationOptions } from './pagination.js';

const FEATURES = [
  {
    key: WORKFLOW_CONFIGURABLE.API,
    normalize: normalizeApiOptions,
    merge: mergeApiOptions,
  },
  {
    key: WORKFLOW_CONFIGURABLE.LAYOUTS,
    normalize: normalizeLayoutsOptions,
    merge: mergeLayoutsOptions,
  },
  {
    key: WORKFLOW_CONFIGURABLE.DATA_PROCESSOR,
    normalize: normalizeDataProcessorOptions,
    merge: mergeDataProcessorOptions,
  },
  {
    key: WORKFLOW_CONFIGURABLE.TRACKERS,
    normalize: normalizeTrackersOptions,
    merge: mergeTrackersOptions,
  },
  {
    key: WORKFLOW_CONFIGURABLE.INTERACTIONS,
    normalize: normalizeInteractionsOptions,
    merge: mergeInteractionsOptions,
  },
  {
    key: WORKFLOW_CONFIGURABLE.PAGINATION,
    normalize: normalizePaginationOptions,
    merge: mergePaginationOptions,
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
    this._defaults = defaults; // TODO: we should call normalize() on defaults
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

class WorkflowConfigurableFeature {

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
      return this[_key] || (this[_key] = new WorkflowConfigurableFeature(this, this._globals, key, normalize, merge));
    },
  });
  Object.defineProperty(WorkflowOptions.prototype, key, {
    get: function() {
      const _key = `_${key}`;
      return this[_key] || (this[_key] = new WorkflowConfigurableFeature(this, this._locals, key, normalize, merge));
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
