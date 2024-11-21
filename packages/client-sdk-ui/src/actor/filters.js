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

export default class Filters {

  constructor(views, { facets: facetsOptions } = {}) {
    this._views = views;
    this._hub = views._hub;
    this._states = this._initialStates = mergeState({}); // TODO: support custom initial states
    const error = this._error = this._error.bind(this);
    this._events = new EventEmitter({ target: this, error });
    defineValues(this, { facets: new Facets(this, facetsOptions) });
  }

  get states() {
    return this._states;
  }

  update(updates) {
    const oldStates = this._states;
    const states = this._states = mergeState({ ...this._states, ...updates });
    this._events.emit('update', { updates, states, oldStates });
  }

  reset() {
    const oldStates = this._states;
    const states = this._states = this._initialStates;
    this._events.emit('reset', { states, oldStates });
  }

  apply() {
    this._hub.update(fields.filters(), this._states);
    this._events.emit('apply');
  }

  _error(error) {
    this._views._error(error);
  }

  _destroy() {}

}

class Facets {

  constructor(filters, options = {}) {
    this._filters = filters;
    this._options = options;
  }

  isSelected(field, value) {
    const state = this._filters._states.facets[field];
    return state && state.includes(value);
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

  _select(field, value) {
    const values = this._options.multiple ? [...(this._filters._states.facets[field] || []), value] : [value];
    values.sort();
    this._filters.update({ facets: { [field]: values } });
  }

  _unselect(field, value) {
    let values = this._filters._states.facets[field].filter(v => v !== value);
    if (values.length === 0) {
      values = undefined;
    }
    this._filters.update({ facets: { [field]: values } });
  }

}
