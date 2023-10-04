import Tracker from './tracker.js';

export default class Trackers {

  constructor(hub, views, params) {
    this._hub = hub;
    this._views = views;
    this._trackers = {};
    for (const [name, options] of Object.entries(params)) {
      this._trackers[name] = new Tracker(hub, views.get(name), options);
      Object.defineProperty(this, name, {
        get: () => this._trackers[name],
      });
    }
  }

  config(options = {}) {
    for (const [name, tracker] of Object.entries(this._trackers)) {
      const op = options === false ? false : options[name];
      if (op !== undefined) {
        tracker.config(op);
      }
    }
  }

  _destroy() {
    for (const tracker of Object.values(this._trackers)) {
      try {
        tracker._destroy();
      } catch (e) {
        console.error(e);
      }
    }
  }

}
