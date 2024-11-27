import { Component, isNullLike } from '@miso.ai/commons';
import { Hub, SessionMaker, DataActor, ViewsActor, InteractionsActor, fields } from '../actor/index.js';
import * as sources from '../source.js';
import { STATUS, ROLE } from '../constants.js';
import { ContainerLayout, ErrorLayout } from '../layout/index.js';
import { injectLogger } from './utils.js';
import { WorkflowOptions, mergeLayoutsOptions, mergeInteractionsOptions, makeConfigurable } from './options.js';
import { writeDataStatus, writeMisoIdToMeta } from './processors.js';

const DEFAULT_LAYOUTS = Object.freeze({
  [ROLE.CONTAINER]: ContainerLayout.type,
  [ROLE.ERROR]: ErrorLayout.type,
});

const ROLES_CONFIG = Object.freeze({
  [ROLE.ERROR]: {
    mapping: data => data.error,
  },
});

function mergeDefaults(workflow, { layouts, interactions, ...defaults } = {}) {
  const DEFAULT_INTERACTIONS = {
    preprocess: [payload => workflow._preprocessInteraction(payload)],
  };
  return {
    ...defaults,
    layouts: mergeLayoutsOptions(DEFAULT_LAYOUTS, layouts),
    interactions: mergeInteractionsOptions(DEFAULT_INTERACTIONS, interactions),
  };
}

function getRevision(data) {
  return data && data.value && data.value.revision;
}

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
    this._options = options || new WorkflowOptions(context && context._options, mergeDefaults(this, args.defaults));
    this._hub = injectLogger(new Hub(), (...args) => this._log(...args));

    this._initProperties(args);
    this._initActors(args);
    this._initSubscriptions(args);
    this._initReset(args);
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
    ];
  }

  _initReset() {
    this.reset();
  }

  get uuid() {
    return this.session && this.session.uuid;
  }

  get session() {
    return this._hub.states[fields.session()];
  }

  get active() {
    const { session } = this;
    return !!session && session.active;
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
  reset() {
    this._sessions.new();
    return this;
  }

  start() {
    this._sessions.start();
    return this;
  }

  restart() {
    this._sessions.restart();
    return this;
  }

  // states //
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
    this._sessions.start(); // in case session not started yet

    data = writeDataStatus(data);
    data = this._defaultProcessData(data);
    for (const process of this._options.resolved.dataProcessor) {
      data = process(data);
    }

    this._hub.update(fields.data(), data);
  }

  _defaultProcessData(data) {
    return writeMisoIdToMeta(data);
  }

  /*
  _mergeDataIfNecessary(data) {
    if (!data._inst || !data._inst.merge) {
      return data;
    }
    return {
      ...this._hub.states[fields.data()],
      ...data,
    };
  }

  _handleResponseObject() {}
  */

  // TODO: notifyViewUpdateAll()

  notifyViewUpdate(role, state) {
    this._assertActive();
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

  // TODO: extract to a separate function
  _preprocessInteraction({
    context: {
      custom_context,
      ...context
    } = {},
    ...payload
  } = {}) {
    const {
      group: api_group,
      name: api_name,
    } = this._options.resolved.api;
    return {
      ...payload,
      context: {
        ...context,
        custom_context: {
          api_group,
          api_name,
          ...custom_context,
        },
      },
    };
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

  _assertActive() {
    if (!this.active) {
      throw new Error(`Unit is not active yet. Call unit.start() to activate it.`)
    }
  }

}

makeConfigurable(Workflow.prototype);
