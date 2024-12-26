import { Component, isNullLike } from '@miso.ai/commons';
import { Hub, SessionMaker, DataActor, ViewsActor, InteractionsActor, fields } from '../actor/index.js';
import * as sources from '../source.js';
import { STATUS, ROLE } from '../constants.js';
import { ContainerLayout, ErrorLayout } from '../layout/index.js';
import { WorkflowOptions, mergeApiOptions, makeConfigurable } from './options.js';
import { getRevision, writeDataStatus, writeMisoIdToMeta, buildBaseInteraction, writeAffiliationInfoToInteraction, mergeInteraction } from './processors.js';

function injectLogger(hub, callback) {
  const { update, trigger } = hub;
  hub.update = (name, state, options) => {
    if (!options || !options.silent) {
      callback('update', name, state, options);
    }
    return update.call(hub, name, state, options);
  }
  hub.trigger = (...args) => {
    callback('trigger', ...args);
    return trigger.apply(hub, args);
  }
  return hub;
}

const DEFAULT_API_OPTIONS = Object.freeze({});

const DEFAULT_LAYOUTS = Object.freeze({
  [ROLE.CONTAINER]: ContainerLayout.type,
  [ROLE.ERROR]: ErrorLayout.type,
});

const DEFAULT_TRACKERS = Object.freeze({});

const DEFAULT_OPTIONS = Object.freeze({
  api: DEFAULT_API_OPTIONS,
  layouts: DEFAULT_LAYOUTS,
  trackers: DEFAULT_TRACKERS,
});

const ROLES_CONFIG = Object.freeze({
  [ROLE.ERROR]: {
    mapping: data => data.error,
  },
});

export default class Workflow extends Component {

  constructor(args) {
    super(args.name || 'workflow', args.plugin);

    let { context, plugin, client, options } = args;
    this._context = context;
    this._plugin = plugin = plugin || context._plugin;
    this._client = client = client || context._client;
    args = Object.freeze({ ...args, plugin, client });

    this._name = args.name;
    this._roles = args.roles;
    this._rolesConfig = { ...ROLES_CONFIG, ...args.rolesConfig };

    this._extensions = plugin._getExtensions(client);
    this._options = options || new WorkflowOptions(context && context._options, args.defaults);
    this._hub = injectLogger(new Hub(), (...args) => this._log(...args));

    this._initProperties(args);
    this._initActors(args);
    this._initSubscriptions(args);
    this._initSession(args);
  }

  _initProperties() {}

  _initActors() {
    const hub = this._hub;
    const client = this._client;
    const roles = this._roles;
    const rolesConfig = this._rolesConfig;
    const options = this._options;
    const extensions = this._extensions;
    const layouts = this._plugin.layouts;

    this._sessions = new SessionMaker(hub);
    this._data = new DataActor(hub, { source: sources.api(client), options });
    this._views = new ViewsActor(hub, { extensions, layouts, roles, rolesConfig, options, workflow: this._name });
    this._interactions = new InteractionsActor(hub, { client, options });
  }

  _initSubscriptions() {
    this._unsubscribes = [
      this._hub.on(fields.response(), data => this.updateData(data)),
      this._hub.on(fields.tracker(), args => this._onTracker(args)),
      this._hub.on(fields.view(this._rolesConfig.main), state => this._onMainViewUpdate(state)),
    ];
  }

  _initSession() {
    this.restart();
  }

  get uuid() {
    return this.session && this.session.uuid;
  }

  get session() {
    return this._hub.states[fields.session()];
  }

  get states() {
    return this._hub.states;
  }

  get status() {
    const data = this._hub.states[fields.data()];
    return data && data.status;
  }

  get views() {
    return this._views.interface;
  }

  // lifecycle //
  restart() {
    this._emitInterruptEventIfNecessary();
    this._sessions.restart();
    return this;
  }

  _emitInterruptEventIfNecessary() {
    const state = this._hub.states[fields.view(this._rolesConfig.main)] || {};
    if (state.session && state.status === STATUS.LOADING) {
      // it's interrupted by a new question
      this._emitLifecycleEvent('interrupt', state);
      this._emitLifecycleEvent('finally', state);
    }
  }

  _onMainViewUpdate(state) {
    const { status } = state;
    const done = status === STATUS.READY;
    const erroneous = status === STATUS.ERRONEOUS;
    const eventName = erroneous ? 'error' : status;
    this._emitLifecycleEvent(eventName, state);
    if (done) {
      this._emitLifecycleEvent('done', state);
    }
    if (done || erroneous) {
      this._emitLifecycleEvent('finally', state);
    }
  }

  _emitLifecycleEvent(name, event) {
    this._emit(name, event);
  }

  // request //
  _request(options = {}) {
    const { session } = this;
    const event = mergeApiOptions(this._options.resolved.api, { ...options, session });
    this._hub.update(fields.request(), event);
  }

  // data //
  updateData(data) {
    if (!data) {
      throw new Error(`Data is required.`);
    }
    const { session } = data;
    if (!session) {
      throw new Error(`Session is required to update data.`);
    }
    if (!this.session) {
      throw new Error(`No session is created yet. Call workflow.restart() to start a new session.`);
    }
    if (session.uuid !== this.session.uuid) {
      return; // ignore data for old session or inactive session
    }

    // compare revision to omit outdated data, if any
    const revision = getRevision(data);
    if (!isNullLike(revision)) {
      const currentRevision = getRevision(this._hub.states[fields.data()]);
      if (!isNullLike(currentRevision) && revision <= currentRevision) {
        return;
      }
    }

    this._updateData(data);

    return this;
  }

  _updateData(data) {
    data = this._defaultProcessData(data);
    for (const process of this._options.resolved.dataProcessor) {
      data = process(data);
    }

    this._updateDataInHub(data);
  }

  _defaultProcessData(data) {
    data = writeDataStatus(data);
    data = writeMisoIdToMeta(data);
    return data;
  }

  _updateDataInHub(data) {
    this._hub.update(fields.data(), data);
  }

  // TODO: notifyViewUpdateAll()

  notifyViewUpdate(role, state) {
    state = {
      status: STATUS.READY,
      session: this.session,
      ...state,
    };
    this._hub.update(fields.view(role), state);
    return this;
  }

  // trackers //
  get trackers() {
    return this._views.trackers;
  }

  _onTracker(args) {
    const payload = this._buildInteraction(args);
    this._sendInteraction(payload);
  }

  _buildInteraction(args) {
    let payload = buildBaseInteraction(args);
    payload = this._defaultProcessInteraction(payload, args);
    const { preprocess = [] } = this._options.resolved.interactions;
    for (const p of preprocess) {
      payload = p(payload, args);
    }
    return payload;
  }

  _defaultProcessInteraction(payload, args) {
    payload = this._writeApiInfoToInteraction(payload, args);
    payload = this._writeMisoIdToInteraction(payload, args);
    payload = writeAffiliationInfoToInteraction(payload, args);
    return payload;
  }

  _writeApiInfoToInteraction(payload) {
    const { group, name } = this._options.resolved.api;
    return mergeInteraction(payload, {
      context: {
        custom_context: {
          api_group: group,
          api_name: name,
        },
      },
    });
  }

  _writeMisoIdToInteraction(payload, args) {
    // TODO: ad-hoc, try to pass info from tracker
    const state = this._hub.states[fields.view(args.role)] || {};
    const miso_id = (state.meta && state.meta.miso_id) || undefined;
    return miso_id ? mergeInteraction(payload, { miso_id }) : payload;
  }

  _sendInteraction(payload) {
    const { handle } = this._options.resolved.interactions;
    if (typeof handle === 'function') {
      handle(payload);
    } else {
      this._hub.trigger(fields.interaction(), payload);
    }
  }

  // destroy //
  destroy(options) {
    this._events.emit('destroy');
    this._destroy(options);
  }

  _destroy({ dom } = {}) {
    for (const unsubscribe of this._unsubscribes || []) {
      unsubscribe();
    }
    this._unsubscribes = [];

    this._views._destroy({ dom });
    this._data._destroy();
  }

  // helper //
  _log(action, name, data) {
    this._emit(name, { _action: action, ...data });
  }

  _emit(name, data) {
    this._events.emit(name, data);
    if (this._context) {
      this._context._events.emit(name, { workflow: this, ...data });
    }
  }

}

makeConfigurable(Workflow.prototype);

Object.assign(Workflow, {
  DEFAULT_API_OPTIONS,
  DEFAULT_LAYOUTS,
  DEFAULT_TRACKERS,
  DEFAULT_OPTIONS,
});
