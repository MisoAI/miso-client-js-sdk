import BaseDataModel from './base';
import { transformResponse } from '../api';

const TYPE = 'list-model';
const CLASS_NAME = 'MisoListModel';

export default class MisoListModel extends BaseDataModel {

  static get type() {
    return TYPE;
  }

  static get className() {
    return CLASS_NAME;
  }

  constructor({ size, ...options } = {}) {
    super(TYPE, options);
    this._size = size;
    // TODO: params
    this._baselineIndex = this._dispatchIndex = 0;
  }

  _createInitialRawData() {
    return {
      items: []
    };
  }

  _baseTransform({ miso_id, items }) {
    return {
      items: items.map(obj => ({ ...obj, miso_id }))
    };
  }

  clear() {
    this._refresh({
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
      let data, hasError;
      try {
        data = this._applyTransform(transformResponse(this.api, await this._fetch(action)));
      } catch (error) {
        hasError = true;
        this._error(error);
        this._emit('error', { ...action, error });
      }
      !hasError && this._refresh({ ...action, data });
    })();
  }

  _pending(action) {
    this._dispatchIndex = action.index;
    this._emit('pending', action);
  }

  _refresh(action) {
    const { index, data } = action;
    if (index > this._baselineIndex) {
      this._baselineIndex = index;
      this._data = data;
      this._emit('refresh', action);
    }
  }

}
