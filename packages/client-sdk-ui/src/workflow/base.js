import { Component, asArray, trimObj } from '@miso.ai/commons';
import { Hub, SessionMaker, DataActor, ViewsActor, InteractionsActor, Trackers, fields } from '../actor/index.js';
import * as sources from '../source/index.js';
import { STATUS, ROLE } from '../constants.js';
import { ContainerLayout, ErrorLayout } from '../layout/index.js';
import { mergeInteractionsOptions, injectLogger } from './utils.js';
import { WorkflowOptions, normalizeApiOptions } from './options.js';

function normalizeLayoutOptions(args) {
  let [name, options] = asArray(args);
  if (typeof name === 'object') {
    options = name;
    name = undefined;
  }
  return [name, options];
}

const IDF = v => v;

const DEFAULT_LAYOUTS = Object.freeze({
  [ROLE.CONTAINER]: ContainerLayout.type,
  [ROLE.ERROR]: ErrorLayout.type,
});

export default class Workflow extends Component {

  constructor({
    name,
    context,
    plugin,
    client,
    roles,
    layouts = {},
    trackers = {},
    interactionsOptions,
    defaults,
  }) {
    super(name || 'workflow', plugin);
    this._context = context;
    this._plugin = plugin = plugin || context._plugin;
    this._client = client = client || context._client;
    this._name = name;
    this._roles = roles;

    const options = this._options = new WorkflowOptions(context && context._options, defaults);

    const extensions = plugin._getExtensions(client);

    this._defaultLayouts = {
      ...DEFAULT_LAYOUTS,
      ...layouts,
    };
    this._defaultInteractionsOptions = interactionsOptions = mergeInteractionsOptions({
      preprocess: payload => this._preprocessInteraction(payload),
    }, interactionsOptions);

    const source = this._source = sources.api(client);
    const hub = this._hub = injectLogger(new Hub(), (...args) => this._log(...args));

    this._sessions = new SessionMaker(hub);
    this._data = new DataActor(hub, source, options);
    this._views = new ViewsActor(hub, extensions, {
      roles,
      layouts: this._generateLayoutFactoryFunctions(this._defaultLayouts),
    });
    this._interactions = new InteractionsActor(hub, client, interactionsOptions);

    this._customProcessData = IDF;

    this._trackers = new Trackers(this._hub, this._views, trackers);

    this._unsubscribes = [
      this._hub.on(fields.response(), data => this.updateData(data)),
    ];
  }

  get uuid() {
    return this.session && this.session.uuid;
  }

  get session() {
    return this._hub.states.session;
  }

  get active() {
    const { session } = this;
    return !!session && session.active;
  }

  get states() {
    return this._hub.states;
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
    this.reset();
    this.start();
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

    this._sessions.start(); // in case session not started yet

    data = this._customProcessData(this._defaultProcessData(data));

    this._hub.update(fields.data(), data);

    return this;
  }

  _defaultProcessData(data) {
    const { value } = data;
    // put miso_id to meta
    if (!value || !value.miso_id) {
      return data;
    }
    return {
      ...data,
      meta: {
        ...data.meta,
        miso_id: value.miso_id,
      },
    };
  }

  useDataProcessor(fn) {
    if (fn && typeof fn !== 'function') {
      throw new Error(`Data processor must be a function or undefined.`);
    }
    this._customProcessData = fn || IDF;
    return this;
  }

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

  // source //
  useApi(name, payload) {
    this._options.api = normalizeApiOptions(name, payload);
    return this;
  }

  // layout //
  useLayouts(layouts = {}) {
    this._views.layouts = this._generateLayoutFactoryFunctions(layouts);
    return this;
  }

  _generateLayoutFactoryFunctions(config) {
    const fns = {};
    for (const [role, args] of Object.entries(config)) {
      if (args === false) {
        fns[role] = () => false;
        continue;
      }
      let [ defaultName, defaultOptions ] = normalizeLayoutOptions(this._defaultLayouts[role]);
      let [ name, options ] = normalizeLayoutOptions(args);
      name = name || defaultName;
      options = { ...defaultOptions, ...options };
      if (!name) {
        throw new Error(`Layout name is required for role ${role}`);
      }
      fns[role] = (overrides) => this._plugin.layouts.create(name, { ...options, ...overrides, role });
    }
    return fns;
  }

  // trackers //
  get trackers() {
    return this._trackers;
  }

  useTrackers(options) {
    this._trackers.config(options);
    return this;
  }

  // interactions //
  useInteractions(options) {
    this._interactions.config(mergeInteractionsOptions(this._defaultInteractionsOptions, options));
    return this;
  }

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
    } = this._options.api;
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
  destroy() {
    this._events.emit('destroy');
    this._destroy();
  }

  _destroy() {
    for (const unsubscribe of this._unsubscribes || []) {
      unsubscribe();
    }
    this._unsubscribes = [];

    this._trackers._destroy();
    this._views.destroy();
    this._data.destroy();
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
