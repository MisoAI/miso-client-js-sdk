import Tracker from './tracker.js';

export default class Trackers {

  constructor(hub, { views, options }) {
    this._hub = hub;
    this._views = views;
    this._options = options;
    this._trackers = {};
    options.on('trackers', () => this._syncConfig());
    this._syncConfig();
  }

  _syncConfig() {
    // TODO: trackers itself can be falsy
    const { trackers } = this._options.resolved;
    for (const [role, options] of Object.entries(trackers)) {
      this._createOrConfigTracker(role, options);
    }
  }

  _createOrConfigTracker(role, options) {
    if (options === undefined) {
      return;
    }
    let tracker = this._trackers[role];
    if (!tracker) {
      tracker = this._trackers[role] = new Tracker(this._hub, this._views.get(role), options);
      Object.defineProperty(this, role, {
        get: () => this._trackers[role],
      });
    } else {
      tracker.config(options);
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
