export default class StallTimeoutAbortController {

  constructor(timeout) {
    this._ac = new AbortController();
    this._timeout = timeout;
    this.touch();
  }

  clear() {
    if (this._timeoutId !== undefined) {
      clearTimeout(this._timeoutId);
      this._timeoutId = undefined;
    }
  }

  touch() {
    this.clear();
    this._timeoutId = setTimeout(() => this.abort(), this._timeout);
  }

  get signal() {
    return this._ac.signal;
  }

  abort(reason) {
    this.clear();
    this._ac.abort(reason || new Error(`Stall timeout: data stay unchanged for ${this._timeout / 1000} seconds.`));
  }

}
