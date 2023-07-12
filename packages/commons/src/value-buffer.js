import Resolution from './resolution';

export default class ValueBuffer {

  constructor() {
    this._index = -1;
    this._done = false;
    this._aborted = false;
    this._abortReason = undefined;
    this._error = undefined;
  }

  get aborted() {
    return this._aborted;
  }

  get abortReason() {
    return this._abortReason;
  }

  get done() {
    return this._done;
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

  error(error) {
    this._error = error;

    if (this._resolution) {
      this._resolution.reject(error);
      this._resolution = undefined;
    }
  }

  abort(reason) {
    this._aborted = true;
    this._abortReason = reason;

    if (this._resolution) {
      if (reason instanceof Error) {
        this._resolution.reject(reason);
      } else {
        this._resolution.resolve();
      }
      this._resolution = undefined;
    }
  }

  async *[Symbol.asyncIterator]() {
    for (let cursor = 0; ; cursor = this._index + 1) {
      // check error
      if (this._error) {
        throw this._error;
      }
      // check aborted
      if (this._aborted) {
        break;
      }
      // wait for next update
      if (cursor > this._index) {
        if (!this._resolution) {
          this._resolution = new Resolution();
        }
        await this._resolution.promise;
      }
      // check aborted behind promise
      if (this._aborted) {
        break;
      }
      yield this._value;
      if (this._done) {
        break;
      }
    }
  }

}
