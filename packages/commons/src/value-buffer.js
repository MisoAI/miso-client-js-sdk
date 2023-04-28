import Resolution from './resolution';

export default class ValueBuffer {

  constructor() {
    this._index = -1;
    this._done = false;
  }

  update(value, done = false) {
    if (this._done) {
      return;
    }
    this._value = value;
    this._done = done;
    this._index++;

    if (this._resolution) {
      this._resolution.resolve();
      this._resolution = undefined;
    }
  }

  async *[Symbol.asyncIterator]() {
    for (let cursor = 0; ; cursor = this._index + 1) {
      if (cursor > this._index) {
        if (!this._resolution) {
          this._resolution = new Resolution();
        }
        await this._resolution.promise;
      }
      yield this._value;
      if (this._done) {
        break;
      }
    }
  }

}
