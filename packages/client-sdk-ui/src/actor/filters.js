import { EventEmitter, trimObj, defineValues } from '@miso.ai/commons';
import * as fields from './fields.js';

function mergeState(state = {}, update = {}) {
  return Object.freeze(trimObj({
    ...state,
    ...update,
    facets: Object.freeze(trimObj({
      ...state.facets,
      ...update.facets,
    })),
  }));
}

function optionsToState({ sort } = {}) {
  // TODO: facets
  return trimObj({
    facets: Object.freeze({}),
    sort: sortOptionsToState(sort),
  });
}

function sortOptionsToState(sort) {
  if (!sort) {
    return undefined;
  }
  const { options = [] } = sort;
  for (const option of options) {
    if (option.default) {
      return Object.freeze(option);
    }
  }
  return Object.freeze(options[0]);
}

export default class Filters {

  constructor(views, { facets: facetsOptions } = {}) {
    this._views = views;
    this._hub = views._hub;
    const error = this._error = this._error.bind(this);
    this._events = new EventEmitter({ target: this, error });
    defineValues(this, { facets: new Facets(this, facetsOptions) });

    this._unsubscribes = [
      views._options.on('filters', () => this._syncOptions()),
    ];

    this._syncOptions();
    this._states = undefined;
  }

  _syncOptions() {
    const options = this._views._options.resolved.filters;
    this._initialStates = optionsToState(options);
    this.apply({ silent: true });
  }

  _getStates() {
    return this._states || this._initialStates;
  }

  update(updates) {
    const oldStates = this._getStates();
    this._states = mergeState({ ...oldStates, ...updates });
    const states = this._getStates();
    this._events.emit('update', { updates, states, oldStates });
  }

  reset({ silent = false } = {}) {
    const oldStates = this._states;
    this._states = undefined;
    const states = this._getStates();
    this._hub.update(fields.filters(), states, { silent });
    this._events.emit('reset', { states, oldStates });
  }

  apply({ silent = false } = {}) {
    const states = this._getStates();
    this._hub.update(fields.filters(), states, { silent });
    !silent && this._events.emit('apply');
  }

  _error(error) {
    this._views._error(error);
  }

  _destroy() {
    for (const unsubscribe of this._unsubscribes) {
      unsubscribe();
    }
    this._unsubscribes = [];
  }

}

class Facets {

  constructor(filters, options = {}) {
    this._filters = filters;
    this._options = options;
  }

  isSelected(field, value) {
    return this._getFieldValues(field).includes(value);
  }

  select(field, value) {
    if (this.isSelected(field, value)) {
      return;
    }
    this._select(field, value);
  }

  unselect(field, value) {
    if (!this.isSelected(field, value)) {
      return;
    }
    this._unselect(field, value);
  }

  toggle(field, value) {
    if (this.isSelected(field, value)) {
      this._unselect(field, value);
    } else {
      this._select(field, value);
    }
  }

  _getFieldValues(field) {
    return this._filters._getStates().facets[field] || [];
  }

  _select(field, value) {
    const values = this._options.multivalued ? [...this._getFieldValues(field), value] : [value];
    values.sort();
    this._filters.update({ facets: { [field]: values } });
  }

  _unselect(field, value) {
    let values = this._getFieldValues(field).filter(v => v !== value);
    if (values.length === 0) {
      values = undefined;
    }
    this._filters.update({ facets: { [field]: values } });
  }

}
