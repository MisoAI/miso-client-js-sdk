import { Component, asArray } from '@miso.ai/commons';
import { Hub, SessionMaker, DataActor, ViewsActor, InteractionsActor, fields } from '../actor';
import * as sources from '../source';
import { STATUS, ROLE } from '../constants';
import { ContainerLayout } from '../layout';
import { mergeApiParams, mergeInteractionsOptions, injectLogger } from './utils';

function normalizeLayoutOptions(args) {
  let [name, options] = asArray(args);
  if (typeof name === 'object') {
    options = name;
    name = undefined;
  }
  return [name, options];
}

const IDF = v => v;

export default class Workflow extends Component {

  constructor(plugin, client, {
    name,
    roles,
    layouts = {},
    defaultApiParams,
    interactionsOptions,
  }) {
    super(name || 'workflow', plugin);
    this._plugin = plugin;
    this._client = client;
    this._name = name;
    this._roles = roles;

    const extensions = plugin._getExtensions(client);

    this._defaultLayouts = {
      [ROLE.CONTAINER]: ContainerLayout.type,
      ...layouts,
    };
    this._apiParams = this._defaultApiParams = defaultApiParams;
    this._defaultInteractionsOptions = interactionsOptions = mergeInteractionsOptions({
      preprocess: payload => this._preprocessInteraction(payload),
    }, interactionsOptions);

    const hub = this._hub = injectLogger(new Hub(), (...args) => this._log(...args));
    this._sessions = new SessionMaker(hub);
    this._data = new DataActor(hub);
    this._views = new ViewsActor(hub, extensions, {
      roles,
      layouts: this._generateLayoutFactoryFunctions(this._defaultLayouts),
    });
    this._interactions = new InteractionsActor(hub, client, interactionsOptions);

    this._unsubscribes = [];

    this._data.source = sources.api(this._client);
    this._customPostProcessData = IDF;
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

    data = this._customPostProcessData(this._postProcessData(data));
    this._hub.update(fields.data(), data);
    return this;
  }

  _postProcessData(data) {
    return data;
  }

  useDataProcessor(fn) {
    if (fn && typeof fn !== 'function') {
      throw new Error(`Data processor must be a function or undefined.`);
    }
    this._data.postProcess = this._customPostProcessData = fn || IDF;
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
    if (name === false) {
      this._data.source = false;
    } else {
      this._apiParams = mergeApiParams(this._defaultApiParams, { name, payload });
    }
    return this;
  }

  // layout //
  useLayouts(layouts) {
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

  // interactions //
  useInteractions(options) {
    this._interactions.config(mergeInteractionsOptions(this._defaultInteractionsOptions, options));
    return this;
  }

  _preprocessInteraction(payload) {
    return payload;
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

    this._views.destroy();
    this._data.destroy();
  }

  // helper //
  _log(action, name, data) {
    this._events.emit(name, { _action: action, ...data });
  }

  _assertActive() {
    if (!this.active) {
      throw new Error(`Unit is not active yet. Call unit.start() to activate it.`)
    }
  }

}
