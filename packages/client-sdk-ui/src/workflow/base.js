import { Component, asArray } from '@miso.ai/commons';
import { Hub, SessionMaker, DataActor, ViewsActor, fields } from '../actor';
import * as sources from '../source';
import { STATUS, ROLE } from '../constants';
import { ContainerLayout } from '../layout';
import { mergeApiParams, injectLogger } from './utils';

export default class Workflow extends Component {

  constructor(plugin, client, {
    name,
    roles,
    layouts = {},
    defaultApiParams,
  }) {
    super(name || 'workflow', plugin);
    this._plugin = plugin;
    this._client = client;
    this._name = name;
    this._roles = roles;

    this._apiParams = this._defaultApiParams = defaultApiParams;

    const hub = this._hub = injectLogger(new Hub(), (...args) => this._log(...args));
    this._sessions = new SessionMaker(hub);
    this._data = new DataActor(hub);
    this._views = new ViewsActor(hub, {
      roles,
      layouts: this._generateLayoutFactoryFunctions({
        [ROLE.CONTAINER]: ContainerLayout.type,
        ...layouts,
      }),
    });

    this._unsubscribes = [];

    //delegateGetters(this, hub, ['states']);

    this.useSource('api');
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

  // states //
  updateData(data) {
    this._assertActive();
    this._hub.update(fields.data(), {
      session: this.session,
      ...data,
    });
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
    this._apiParams = mergeApiParams(this._defaultApiParams, { name, payload });
    return this;
  }

  useSource(source) {
    this._data.source = this._normalizeSource(source);
    return this;
  }

  _normalizeSource(source) {
    if (source === 'api') {
      return sources.api(this._client);
    } else if (source === false || typeof source === 'function') {
      return source;
    }
    throw new Error(`Source must be 'api', an async function, or false: ${source}`);
  }

  // layout //
  useLayouts(layouts) {
    this._views.layouts = this._generateLayoutFactoryFunctions(layouts);
    return this;
  }

  _generateLayoutFactoryFunctions(config) {
    // TODO: merge config with default values
    const fns = {};
    for (const [role, args] of Object.entries(config)) {
      const [ name, options ] = asArray(args);
      fns[role] = (overrides) => this._plugin.layouts.create(name, { ...options, ...overrides, role });
    }
    return fns;
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

  _assertInactive() {
    if (this.active) {
      throw new Error(`Unit has already started.`);
    }
  }

}
