export default class Stopwatch {

  constructor() {
    this.clear();
  }

  getDuration(now = Date.now()) {
    return this._duration + (this._start ? now - this._start : 0);
  }

  start() {
    if (this._start) {
      return;
    }
    this._start = Date.now();
  }

  stop() {
    if (!this._start) {
      return;
    }
    this._duration += Date.now() - this._start;
    this._start = undefined;
  }

  clear() {
    this._start = undefined;
    this._duration = 0;
  }

}
