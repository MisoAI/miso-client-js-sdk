import { ROLE } from '../constants.js';
import Tracker from './tracker.js';

export default class TrackersActor {

  constructor(hub, { options }) {
    this._hub = hub;
    this._options = options;
    this._trackers = {};
  }

  get(role) {
    if (!this._trackers[role]) {
      const itemless = role === ROLE.CONTAINER;
      this._trackers[role] = new Tracker({
        hub: this._hub,
        role,
        itemless,
        options: () => this._getTrackerOptions(role),
      });
    }
    return this._trackers[role];
  }

  _getTrackerOptions(role) {
    const allTrackerOptions = this._options.resolved.trackers;
    return allTrackerOptions && allTrackerOptions[role] || { active: false };
  }

}
