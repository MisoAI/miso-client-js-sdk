import { defineValues, delegateGetters, isElement, asArray } from '@miso.ai/commons';
import { Saga, ElementsBinder, SessionMaker, DataSupplier, ViewsReactor, Tracker, Logger, fields } from '../saga';
import * as source from '../source';
import { ListLayout } from '../layout';
import { STATUS, ROLE } from '../constants';

const DEFAULT_LAYOUT = ListLayout.type;
const DEFAULT_API_GROUP = 'recommendation';
const DEFAULT_API_NAME = 'user_to_products';
const DEFAULT_API_PAYLOAD = Object.freeze({ fl: ['*'] });

export default class RecommendationUnit {

  constructor(context, id) {
    defineValues(this, { id });
    this._context = context;
    this._plugin = context._plugin;

    const saga = this._saga = new Saga();
    this._logger = new Logger(saga);
    this._elements = new ElementsBinder(saga);
    this._sessions = new SessionMaker(saga);
    this._data = new DataSupplier(saga);
    this._views = new ViewsReactor(saga, [ROLE.RESULTS]);
    this._tracker = new Tracker(saga);
    this._apiSource = source.api(context._client);

    this._unsubscribe = [
      saga.on('event', event => this._handleEvent(event)),
    ];

    delegateGetters(this, saga, ['states', 'on']);

    context._units.set(id, this);

    this.useSource('api');
    this.useApi(DEFAULT_API_NAME);
    this.useLayout(DEFAULT_LAYOUT);
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
  get element() {
    return this._saga.elements.get(ROLE.RESULTS);
  }

  bind(role, element) {
    if (element === undefined && isElement(role)) {
      element = role;
      role = ROLE.RESULTS;
    }
    this._elements.bind(role, element);
    return this;
  }

  unbind(role = ROLE.RESULTS) {
    this._elements.unbind(role);
    return this;
  }

  // lifecycle //
  reset() {
    this._sessions.new();
    return this;
  }

  start() {
    this._sessions.start();
    this._saga.update(fields.input(), this._apiParams);
    return this;
  }

  startTracker() {
    this.useSource(false);
    this.useLayout(false);
    this._sessions.start();
    this.notifyViewUpdate();
    return this;
  }

  // states //
  updateData(data) {
    this._assertActive();
    this._saga.update(fields.data(), {
      session: this.session,
      ...data,
    });
    return this;
  }

  notifyViewUpdate(state) {
    this._assertActive();
    this._saga.update(fields.view(ROLE.RESULTS), {
      status: STATUS.READY,
      session: this.session,
      ...state,
    });
    return this;
  }

  // source //
  useApi(name, payload) {
    this._assertInactive();
    this._apiParams = Object.freeze({
      group: DEFAULT_API_GROUP,
      name,
      payload: {
        ...DEFAULT_API_PAYLOAD,
        ...payload
      },
    });
    return this;
  }

  useSource(source) {
    this._assertInactive();
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
  useLayout(layout, options) {
    this.useLayouts({
      [ROLE.RESULTS]: [layout, options],
    });
    return this;
  }

  useLayouts(layouts) {
    for (let [role, args] of Object.entries(layouts)) {
      this._views.get(role).layout = this._plugin.layouts.create(...asArray(args));
    }
    return this;
  }

  // tracker //
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

  // destroy //
  destroy() {
    this._events.emit('destroy');
    this._context._units.delete(this.id);

    for (const unsubscribe of this._unsubscribes) {
      unsubscribe();
    }
    this._unsubscribes = [];

    this._tracker._destroy();
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
