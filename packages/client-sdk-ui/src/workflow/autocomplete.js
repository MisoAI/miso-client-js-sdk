import { STATUS } from '../constants.js';
import { fields } from '../actor/index.js';
import Workflow from './base.js';

const ROLES_OPTIONS = Object.freeze({
  members: [],
});

function shimDefaults({ layouts, trackers, ...options } = {}) {
  return {
    active: false,
    ...options,
    layouts: {},
    trackers: {},
  };
}

function sameInputValue(a, b) {
  return getInputValue(a) === getInputValue(b);
}

function getInputValue(args) {
  return (args && args.value && args.value.trim()) || undefined;
}

export default class Autocomplete extends Workflow {

  constructor(superworkflow, { defaults, ...args } = {}) {
    super({
      name: 'autocomplete',
      plugin: superworkflow._plugin,
      client: superworkflow._client,
      defaults: shimDefaults(defaults),
      roles: ROLES_OPTIONS,
      superworkflow,
      ...args,
    });
  }

  _initProperties(args) {
    super._initProperties(args);
    this._superworkflow = args.superworkflow;
    this._active = args.defaults.active;
  }

  _initSubscriptions(args) {
    // TODO: how to sync options updates
    super._initSubscriptions(args);
    this._unsubscribes = [
      ...this._unsubscribes,
      args.superworkflow._hub.on(fields.input(), args => this._query(args)),
    ];
  }

  // API //
  get enabled() {
    return this._active;
  }

  enable() {
    this._active = true;
  }

  disable() {
    this._active = false;
  }

  // query //
  _query(args) {
    if (!this._active || sameInputValue(args, this._args)) {
      return;
    }
    this._args = args;

    // start a new session
    this.restart();
    const { session } = this;
    session.meta.input = args;

    // if input value is blank, emit empty response
    if (!getInputValue(args)) {
      this._updateCompletions({ session, status: STATUS.INITIAL });
      return;
    }

    // payload
    const payload = this._buildPayload(args);

    // request
    this._request({ payload });
  }

  _buildPayload(args) {
    return { q: getInputValue(args) };
  }

  // data //
  _updateDataInHub(data) {
    if (data.value) {
      data = {
        ...data,
        value: data.value.completions,
      };
    }
    // update completion field in superworkflow hub
    this._updateCompletions(data);
  }

  _updateCompletions(data) {
    // TODO: session is different
    this._superworkflow.updateCompletions(data);
  }

}
