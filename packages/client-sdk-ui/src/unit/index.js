import { uuidv4, trimObj, defineValues, EventEmitter } from '@miso.ai/commons';
import DataReactor from './data';
import ViewReactor from './view';
import Tracker from './tracker';
import { ApiDataSource } from '../source';
import { ListWidget } from '../widget';
import { VIEW_STATUS } from '../constants';

const DEFAULT_WIDGET_TYPE = ListWidget.type;
const DEFAULT_API_NAME = 'user_to_products';
const DEFAULT_API_PAYLOAD = Object.freeze({ fl: ['*'] });

export default class Unit {

  constructor(context, id) {
    defineValues(this, { id });
    (this._events = new EventEmitter())._injectSubscribeInterface(this);
    this._context = context;
    this._sessionIndex = 0;

    this._apiDataSource = new ApiDataSource(context._client);
    this._dataReactor = new DataReactor(this);
    this._viewReactor = new ViewReactor(this);
    this._tracker = new Tracker(this);

    this._dataReactor.source = this._apiDataSource;
    this.useApi(DEFAULT_API_NAME, DEFAULT_API_PAYLOAD);
    this.useWidget();

    this._reset();

    context._units.set(id, this);
  }

  get uuid() {
    return this._session.uuid;
  }

  get session() {
    return this._session;
  }

  get active() {
    return this._active;
  }

  get tracker() {
    return this._tracker;
  }

  reset() {
    if (!this._active) {
      return;
    }
    this._events.emit('reset', Object.freeze({ session: this.session }));
    this._reset();
    return this;
  }

  _reset() {
    this._active = false;
    this._session = {
      uuid: uuidv4(),
      index: this._sessionIndex++,
    };
    this._dataContext = undefined;
    this._viewState = undefined;
  }

  start() {
    if (this._active) {
      return;
    }
    this._active = true;
    this._events.emit('start', Object.freeze({ session: this.session }));
    return this;
  }

  startTracker() {
    this.useSource(false);
    this.useWidget(false);
    this.start();
    this.notifyViewUpdate();
    return this;
  }

  // element //
  get element() {
    return this._element;
  }

  bind(element) {
    if (this._element === element) {
      return;
    }
    if (this._element) {
      throw new Error(`There is already an element bound with unit: '${this.id}'`);
    }
    if (this._context._e2u.has(element)) {
      throw new Error(`The element is already bound to another unit.`);
    }
    this._element = element;
    this._context._e2u.set(element, this);
    this._events.emit('bind', element);
    return this;
  }

  unbind() {
    const element = this._element;
    if (!element) {
      return;
    }
    this._context._e2u.delete(element);
    this._element = undefined;
    this._events.emit('unbind', element);
    return this;
  }

  // data //
  get data() {
    return this._dataContext && this._dataContext.data;
  }

  get dataError() {
    return this._dataContext && this._dataContext.error;
  }

  updateData({ error, data } = {}) {
    this._assertActive();
    this._dataContext = Object.freeze({ error, data });
    this._events.emit('data', Object.freeze({ error, data, session: this.session }));
    return this;
  }

  // view state //
  get viewState() {
    return this._viewState;
  }

  notifyViewUpdate(state) {
    //this._assertActive();
    this._viewState = Object.freeze(trimObj({
      session: this.session,
      status: VIEW_STATUS.READY,
      ...state,
    }));
    this._events.emit('render', this._viewState);
    return this;
  }

  // source //
  useApi(name, payload) {
    this._assertInactive();
    this._apiDataSource.setParameters(name, payload);
    return this;
  }

  useSource(source) {
    this._assertInactive();
    this._dataReactor.source = this._normalizeSource(source);
    return this;
  }

  _normalizeSource(source) {
    switch (typeof source) {
      case 'boolean':
        return source ? this._apiDataSource : undefined;
      case 'string':
        if (source === 'api') {
          return this._apiDataSource;
        }
        break;
      case 'function':
        return { supply: source };
    }
    throw new Error(`Source must be 'api', a supply function, or a boolean value: ${source}`);
  }

  // widget //
  useWidget(widget, options) {
    this._viewReactor.widget = this._normalizeWidget(widget, options);
    return this;
  }

  _normalizeWidget(widget = DEFAULT_WIDGET_TYPE, options) {
    switch (typeof widget) {
      case 'boolean':
        return widget ? this._createWidgetFromLibs(DEFAULT_WIDGET_TYPE) : undefined;
      case 'string':
        return this._createWidgetFromLibs(widget, options);
      case 'function':
        return { render: widget };
      default:
        throw new Error(`Widget must be a string, a render function, or a boolean value: ${widget}`);
    }
  }

  _createWidgetFromLibs(type, options) {
    const widgetClass = this._context._plugin.widgets.get(type);
    if (!widgetClass) {
      throw new Error(`Widget of name '${type}' not found.`);
    }
    return new widgetClass(options);
  }

  get widget() {
    return this._widget;
  }

  // tracker //
  useTracker(options) {
    this._tracker.config(options);
    return this;
  }

  _triggerEvent(event) {
    this._assertActive();
    const { session, id } = this;
    const { uuid } = session;
    this._context.interactions._send({ uuid, id }, event);
    this._events.emit('event', Object.freeze({ ...event, session }));
  }

  // destroy //
  destroy() {
    this._events.emit('destroy');
    this._context._units.delete(this.id);
    this._viewReactor._destroy();
    this._tracker._destroy();
    this.unbind();
    // TODO
    return this;
  }

  // helper //
  _assertActive() {
    if (!this._active) {
      throw new Error(`Unit is not active yet. Call unit.start() to activate it.`)
    }
  }

  _assertInactive() {
    if (this._active) {
      throw new Error(`Unit has already started.`);
    }
  }

}
