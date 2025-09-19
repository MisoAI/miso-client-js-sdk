import { Component, isNullLike, mergeInteractions } from '@miso.ai/commons';
import { Hub, SessionMaker, DataActor, ViewsActor, InteractionsActor, TrackersActor, fields } from '../actor/index.js';
import * as sources from '../source.js';
import { STATUS, ROLE } from '../constants.js';
import { ContainerLayout, ErrorLayout } from '../layout/index.js';
import { WorkflowOptions, mergeApiOptions, makeConfigurable } from './options/index.js';
import {
  getRevision,
  writeRequestFromPreviousData,
  writeDataStatus,
  writeMisoIdToMeta,
  buildBaseInteraction,
  writeRequestMetadataToInteraction,
  writeAffiliationInfoToInteraction,
} from './processors.js';

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

const ROLES_OPTIONS = Object.freeze({
  mappings: {
    [ROLE.ERROR]: data => data.error,
  },
});

export default class Workflow extends Component {

  constructor(args) {
    super(args.name || 'workflow', args.plugin);

    let { context, plugin, client, defaults, options, extraOptions } = args;
    this._context = context;
    this._plugin = plugin = plugin || context._plugin;
    this._client = client = client || context._client;
    args = Object.freeze({ ...args, plugin, client });

    this._name = args.name;
    this._roles = args.roles;

    this._extensions = plugin._getExtensions(client);
    this._defaults = defaults;
    this._options = options || new WorkflowOptions(context && context._options, defaults);
    this._extraOptions = extraOptions || {};
    this._hub = new Hub({
      onUpdate: event => this._onHubUpdate(event),
      onEmit: event => this._onHubEmit(event),
    });
    this._sessionContext = new WeakMap();

    client._events.emit('workflow', this);

    this._initProperties(args);
    this._initActors(args);
    this._initSubscriptions(args);
    this._initSession(args);
  }

  _initProperties() {}

  _initActors({ roles }) {
    const hub = this._hub;
    const client = this._client;
    const options = this._options;
    const extensions = this._extensions;
    const layouts = this._plugin.layouts;

    this._sessions = new SessionMaker(hub);
    this._data = new DataActor(hub, { source: sources.api(client), options, ...this._extraOptions.api });
    this._views = new ViewsActor(hub, { extensions, layouts, roles, options, workflow: this });
    //this._trackers = new TrackersActor(hub, { options });
    this._interactions = new InteractionsActor(hub, { client, options });
  }

  _initSubscriptions({ roles }) {
    this._unsubscribes = [
      this._hub.on(fields.session(), session => this._onSession(session)),
      this._hub.on(fields.response(), data => this.updateData(data)),
      this._hub.on(fields.tracker(), args => this._onTracker(args)),
    ];
    if (roles.main) {
      this._unsubscribes.push(this._hub.on(fields.view(roles.main), state => this._onMainViewUpdate(state)));
    }
  }

  _initSession() {
    this.restart();
  }

  _getSessionContext(session) {
    let context = this._sessionContext.get(session);
    if (!context) {
      this._sessionContext.set(session, context = {});
    }
    return context;
  }

  // hub //
  _onHubUpdate(event) {
    this._runCallbacks(this._client.meta.parent._hubUpdateCallbacks, event);
  }

  _onHubEmit(event) {
    this._runCallbacks(this._client.meta.parent._hubEmitCallbacks, event);
    this._emitAsWorkflowEvent(event);
  }

  _emitAsWorkflowEvent({ action: _action, name, state, silent }) {
    if (!silent) {
      this._emit(name, { _action, ...state });
    }
  }

  // properties //
  get uuid() {
    // TODO: review this
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
    const { main } = this._roles;
    if (!main) {
      return;
    }
    const state = this._hub.states[fields.view(main)] || {};
    if (state.session && state.status === STATUS.LOADING) {
      // it's interrupted by a new question
      this._emitLifecycleEvent('interrupt', state);
      this._emitLifecycleEvent('finally', state);
    }
  }

  _onSession(session) {
    this.updateData({ session });
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

  _shallEmitLifecycleEvent(name, { session }) {
    const context = this._getSessionContext(session);
    const events = context.lifecycleEvents || (context.lifecycleEvents = new Set());
    const emitted = events.has(name);
    events.add(name);
    return !emitted;
  }

  _emitLifecycleEvent(name, event) {
    if (!this._shallEmitLifecycleEvent(name, event)) {
      return;
    }
    this._emit(name, event);
  }

  // request //
  _request(options = {}) {
    const { session } = this;
    const request = mergeApiOptions(this._options.resolved.api, options);
    this.updateData({ session, request });
    this._hub.update(fields.request(), { ...request, session });
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
    const oldData = this._hub.states[fields.data()];
    data = this._defaultProcessData(data, oldData);
    for (const process of this._options.resolved.dataProcessor) {
      data = process(data, oldData);
    }

    this._updateDataInHub(data, oldData);
  }

  _defaultProcessData(data, oldData) {
    data = writeRequestFromPreviousData(data, oldData);
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
    const data = this._hub.states[fields.data()];
    const payload = this._buildInteraction({ ...args, data });
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
    payload = writeRequestMetadataToInteraction(payload, args);
    payload = this._writeApiInfoToInteraction(payload, args);
    payload = this._writeRequestInfoToInteraction(payload, args);
    payload = this._writeMisoIdToInteraction(payload, args);
    payload = writeAffiliationInfoToInteraction(payload, args);
    return payload;
  }

  _writeApiInfoToInteraction(payload) {
    const { group, name } = this._options.resolved.api;
    return mergeInteractions(payload, {
      context: {
        custom_context: {
          api_group: group,
          api_name: name,
        },
      },
    });
  }

  _writeRequestInfoToInteraction(payload, args) {
    return payload;
  }

  _writeMisoIdToInteraction(payload, args) {
    // TODO: ad-hoc, try to pass info from tracker
    const state = this._hub.states[fields.view(args.role)] || {};
    const miso_id = (state.meta && state.meta.miso_id) || undefined;
    return miso_id ? mergeInteractions(payload, { miso_id }) : payload;
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
    this._emit('destroy');
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
  _runCallbacks(callbacks, event) {
    for (const callback of callbacks) {
      try {
        callback({ workflow: this, ...event });
      } catch(e) {
        this._error(e);
      }
    }
  }

  _emit(name, data) {
    this._events.emit(name, { _event: name, ...data });
    if (this._context) {
      this._context._events.emit(name, { workflow: this, _event: name, ...data });
    }
  }

}

makeConfigurable(Workflow.prototype);

Object.assign(Workflow, {
  DEFAULT_API_OPTIONS,
  DEFAULT_LAYOUTS,
  DEFAULT_TRACKERS,
  DEFAULT_OPTIONS,
  ROLES_OPTIONS,
});
