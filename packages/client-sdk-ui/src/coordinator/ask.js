import { delegateGetters, asArray } from '@miso.ai/commons';
import { Saga, ElementsBinder, SessionMaker, DataSupplier, ViewsReactor, Logger } from '../saga';
import * as source from '../source';
import { STATUS, ROLE } from '../constants';

const DEFAULT_API_NAME = 'ask';
const DEFAULT_API_PARAMS = Object.freeze({
  group: 'search',
  name: DEFAULT_API_NAME,
  payload: {
    fl: ['*'],
  },
});

function mergeApiParams(base, overrides = {}) {
  return Object.freeze({
    ...base,
    ...overrides,
    payload: Object.freeze({
      ...base.payload,
      ...overrides.payload,
    })
  });
}

const ROLES = [ROLE.ANSWER, ROLE.SOURCES, ROLE.FURTHER_READS];

export default class Ask {

  constructor(plugin, client) {
    this._plugin = plugin;
    this._client = client;

    const saga = this._saga = new Saga();
    this._logger = new Logger(saga);
    this._elements = new ElementsBinder(saga);
    this._sessions = new SessionMaker(saga);
    this._data = new DataSupplier(saga);
    this._views = new ViewsReactor(saga, ROLES);
    //this._tracker = new Tracker(saga);
    this._apiSource = source.api(client);

    /*
    this._unsubscribe = [
      saga.on('event', event => this._handleEvent(event)),
    ];
    */

    delegateGetters(this, saga, ['states', 'on']);

    this.useSource('api');
    this.useApi(DEFAULT_API_NAME);
    this.useLayouts({
      [ROLE.ANSWER]: 'plaintext',
      [ROLE.SOURCES]: 'list',
      [ROLE.FURTHER_READS]: 'list',
    });
  }

  get uuid() {
    return this.session && this.session.uuid;
  }

  get session() {
    return this._saga.states.session;
  }

  get active() {
    const { session } = this;
    return !!session && session.active;
  }

  get tracker() {
    return this._tracker;
  }

  get states() {
    return this._saga.states;
  }

  // element //
  bind(role, element) {
    this._elements.bind(role, element);
    return this;
  }

  unbind(role) {
    this._elements.unbind(role);
    return this;
  }

  // lifecycle //
  query(payload) {
    this._sessions.new();
    this._sessions.start();
    this._saga.update('input', mergeApiParams(this._apiParams, { payload }));
    return this;
  }

  /*
  startTracker() {
    this.useSource(false);
    this.useLayout(false);
    this.start();
    this.notifyViewUpdate();
    return this;
  }
  */

  // states //
  updateData(data) {
    this._assertActive();
    this._saga.update('data', {
      session: this.session,
      ...data,
    });
    return this;
  }

  notifyViewUpdate(state) {
    this._assertActive();
    this._saga.update('view', {
      status: STATUS.READY,
      session: this.session,
      ...state,
    });
    return this;
  }

  // source //
  useApi(name, payload) {
    this._apiParams = mergeApiParams(DEFAULT_API_PARAMS, { name, payload });
    return this;
  }

  useSource(source) {
    this._data.source = this._normalizeSource(source);
    return this;
  }

  _normalizeSource(source) {
    if (source === 'api') {
      return this._apiSource;
    } else if (source === false || typeof source === 'function') {
      return source;
    }
    throw new Error(`Source must be 'api', an async function, or a boolean value: ${source}`);
  }

  // layout //
  useLayouts(layouts) {
    for (let [role, args] of Object.entries(layouts)) {
      this._views.get(role).layout = this._plugin.layouts.create(...asArray(args));
    }
    return this;
  }

  // tracker //
  /*
  useTracker(options) {
    this._tracker.config(options);
    return this;
  }

  // TODO: make interactions a saga component?
  _handleEvent(event) {
    this._assertActive();
    const { uuid, id } = this;
    this._context.interactions._send({ uuid, id }, event);
  }
  */

  // destroy //
  destroy() {
    this._events.emit('destroy');

    for (const unsubscribe of this._unsubscribes) {
      unsubscribe();
    }
    this._unsubscribes = [];

    //this._tracker._destroy();
    this._views.destroy();
    this._data.destroy();
    this.unbind();
    this._elements.destroy();
    return this;
  }

  // helper //
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
