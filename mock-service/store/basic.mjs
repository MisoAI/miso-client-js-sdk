export default class BasicStore {

  constructor({key = 'id'} = {}) {
    this._options = {
      key
    };
    this._array = [];
    this._map = new Map();
  }

  async add(object) {
    if (Array.isArray(object)) {
      object.forEach(obj => this._add(obj));
      return;
    }
    this._add(object);
  }

  async addm(object) {
    // assert array
    Array.prototype.forEach.call(object, this._add.bind(this));
  }

  _add(object) {
    this._array.push(object);
    this._map.set(object[this._options.key], object);
  }

  async get(id) {
    return this._map.get(id);
  }

  async getm({size = 5, ids} = {}) {
    if (Array.isArray(ids)) {
      return ids.map(this.get.bind(this));
    }
    return this._getRandomObjs(size);
  }

  _getRandomObjs(size) {
    const len = this._array.length;
    const offset = Math.floor(Math.random() * (len - size + 1));
    return this._array.slice(offset, offset + size);
  }

  async delete(id) {
    // TODO
  }

}
