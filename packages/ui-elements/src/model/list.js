import BaseDataModel from './base';

const TYPE = 'list-model';

export default class MisoListModel extends BaseDataModel {

  static get type() {
    return TYPE;
  }

  constructor({ size, ...options } = {}) {
    super(TYPE, options);
    this._size = size;
    // TODO: params
    this._baselineIndex = this._dispatchIndex = 0;
  }

  _createInitialData() {
    return {
      items: []
    };
  }

  clear() {
    this._replace({
      index: (this._dispatchIndex = this._nextActionIndex()),
      name: 'clear',
      data: this._createInitialData(),
    });
  }

  load(payload) {
    const index = this._nextActionIndex();
    // TODO: size, etc
    payload = { ...payload };
    const action = { index, name: 'load', payload };
    this._pending(action);
    (async () => {
      try {
        const data = this._transformData(await this._source.fetch(payload));
        this._replace({ ...action, data });
      } catch (error) {
        this._error({ ...action, error });
      }
    })();
  }

  _pending(action) {
    this._dispatchIndex = action.index;
    this._emit('pending', action);
  }

  _replace(action) {
    const { index, data } = action;
    if (index > this._baselineIndex) {
      this._baselineIndex = index;
      this._data = data;
      this._emit('replace', action);
    }
  }

  _transformData({ miso_id, items }) {
    return {
      items: items.map(obj => ({ ...obj, miso_id }))
    };
  }

  _error(action) {
    this._emit('error', action);
  }

}
