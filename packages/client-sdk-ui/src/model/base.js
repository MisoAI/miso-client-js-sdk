import { delegateGetters, defineValues, Component, assertNullableFunction } from '@miso.ai/commons';
import root from '../root';
import DataSource from './source';

const identity = v => v;

function wrapCustomFetch(model, fetch) {
  return async (action) => {
    await model._source.whenReady();
    const client = model._source.client;
    return fetch({ ...action, client });
  }
}

export default class BaseDataModel extends Component {

  constructor(type, { client, api, payload, autoClient = true, transform, fetch } = {}) {
    super('model', root());
    this._events._replays.add('create');
    this._type = type;
  
    if (!api) {
      throw Error(`Require api name in options.`);
    }
    const customMode = api === 'custom';
    if (customMode && !fetch) {
      throw new Error(`Require custom fetch function if api="custom".`);
    }
    if (customMode && fetch) {
      console.warn(`Custom fetch function is only applied when api is "custom" (currently ${api}).`);
    }
    const source = this._source = new DataSource({ client, api, payload, autoClient });

    delegateGetters(this, this._source, ['client']);
    defineValues(this, { type, api, payload, transform });

    // transform pass
    assertNullableFunction(transform, value => `Parameter "transform" must be a function: ${value}`);
    this._transform = transform || identity;

    // custom fetch
    assertNullableFunction(fetch, value => `Parameter "fetch" must be a function: ${value}`);
    this._fetch = customMode ? wrapCustomFetch(this, fetch) : source.fetch.bind(source);
    // TODO: setters: client

    this._data = this._createInitialData();
    this._actionIndex = 0;
    this._events.emit('create', this);
  }

  get data() {
    return this._data;
  }

  _createInitialData() {
    this._applyTransform(this._createInitialRawData());
  }

  _createInitialRawData() {
    throw new Error('_createInitialRawData Unimplemented.');
  }

  _applyTransform(data) {
    return this._transform(this._baseTransform(data));
  }

  _baseTransform(data) {
    return data;
  }

  _nextActionIndex() {
    return ++this._actionIndex;
  }

  _emit(name, data) {
    this._events.emit(name, { ...data, instance: this });
  }

}
