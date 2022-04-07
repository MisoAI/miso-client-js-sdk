import { delegateGetters, defineValues, Component } from '@miso.ai/commons';
import root from '../root';
import DataSource from './source';

export default class BaseDataModel extends Component {

  constructor(type, { client, api, payload, autoClient = true } = {}) {
    super('model', root());
    this._events._replays.add('create');
    this._type = type;
  
    if (!api) {
      throw Error(`Require api name in options.`);
    }
    this._source = new DataSource({ client, api, payload, autoClient });
    delegateGetters(this, this._source, ['client']);
    defineValues(this, { type, api, payload });

    // TODO: setters: client

    this._data = this._createInitialData();
    this._actionIndex = 0;
    this._events.emit('create', this);
  }

  get data() {
    return this._data;
  }

  _createInitialData() {
    throw new Error('_createInitialData Unimplemented.');
  }

  _nextActionIndex() {
    return ++this._actionIndex;
  }

  _emit(name, data) {
    this._events.emit(name, { ...data, instance: this });
  }

}
