import { STATUS } from '../constants.js';
import * as fields from './fields.js';

export default class AutocompleteActor {

  constructor(hub, { source, options }) {
    this._hub = hub;
    this._source = source;
    this._options = options;
    this._index = -1;

    this._unsubscribes = [
      hub.on(fields.input(), () => this._sync()),
      options.on('autocomplete', () => this._syncOptions()),
    ];

    // sync right away
    this._sync(true);
  }

  get active() {
    return this._options.resolved.autocomplete.actor !== false;
  }

  get source() {
    return this._source;
  }

  _syncOptions() {
    // TODO: explore scenarios where options.actor true -> false
    this._sync(true);
  }

  async _sync(force = false) {
    // protocol: inactive -> no reaction
    if (!this.active) {
      return;
    }

    const { input } = this._hub.states;
    const value = input && input.value && input.value.trim() || undefined;

    if (sameInput(this._input, input) && !force) {
      return;
    }
    this._input = input;
    const index = ++this._index;

    // new input, abort previous data fetch if any
    this._clearTimeout();
    this._abortPendingRequest({
      type: 'new-input',
      message: 'A new input renders previous autocomplete request obsolete.',
    });

    // emit loading/initial state
    this._emitCompletions({ index, input, status: value ? STATUS.LOADING : STATUS.INITIAL });

    if (!value) {
      return;
    }

    try {
      const response = await this._fetchCompletions(input);
      if (this._index !== index) {
        return; // new results loading, discard this one
      }
      this._emitCompletions({ index, input, status: STATUS.READY, value: response.completions });
    } catch (error) {
      this._error(error);
      if (this._index !== index) {
        return; // ignore
      }
      this._emitCompletions({ index, input, status: STATUS.ERRONEOUS, error });
    }
  }

  async _getCompletions(input) {
    // TODO: cache
    return await this._fetchCompletions(input);
  }

  async _fetchCompletions({ value }) {
    // TODO: other options?
    const { api } = this._options.resolved.autocomplete;
    const { group, name } = api;
    const { signal } = this._ac || {};
    const options = { ...api.options, signal };
    const payload = { ...api.payload, q: value };
    return await this._source({ group, name, payload, options });
  }

  _clearTimeout() {
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
      this._timeoutId = undefined;
    }
  }

  _abortPendingRequest(info) {
    this._ac && this._ac.abort(info);
    this._ac = new AbortController();
  }

  _emitCompletions(event) {
    event.source = 'actor';
    this._hub.update(fields.completions(), event);
  }

  _error(error) {
    // TODO
    console.error(error);
  }

  _destroy() {
    // abort ongoing data fetch if any
    this._ac && this._ac.abort({
      type: 'autocomplete-actor-destroy',
      message: 'Autocomplete actor is destroyed.',
    });
    for (const unsubscribe of this._unsubscribes) {
      unsubscribe();
    }
    this._unsubscribes = [];
  }

}

function sameInput(a, b) {
  return (!a && !b) || (a && b && a.value === b.value);
}
