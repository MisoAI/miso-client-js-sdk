import { delegateGetters, defineValues, Component } from '@miso.ai/commons';
import root from '../root';
import DataSource from './source';

const identity = v => v;

export default class BaseDataModel extends Component {

  constructor(type, { client, api, payload, autoClient = true, transform } = {}) {
    super('model', root());
    this._events._replays.add('create');
    this._type = type;
  
    if (!api) {
      throw Error(`Require api name in options.`);
    }
    this._source = new DataSource({ client, api, payload, autoClient });

    delegateGetters(this, this._source, ['client']);
    defineValues(this, { type, api, payload, transform });

    if (transform !== undefined && typeof transform !== 'function') {
      throw new Error(`Transform value must be a function: ${transform}`);
    }
    this._transform = transform || identity;
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
