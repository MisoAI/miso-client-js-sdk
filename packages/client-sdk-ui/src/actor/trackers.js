import { ROLE } from '../constants.js';
import Tracker from './tracker.js';

export class TrackersActor {

  constructor(hub, { roles, options }) {
    this._hub = hub;
    this._roles = roles;
    this._options = options;
    this._trackers = {};
  }

  get(role) {
    if (!this._roles.members.includes(role)) {
      throw new Error(`Role "${role}" is not a member of this workflow.`);
    }
    if (!this._trackers[role]) {
      this._trackers[role] = new Tracker({
        hub: this._hub,
        role,
        itemless: role === ROLE.CONTAINER,
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

export function proxyTrackers(trackers) {
  return new Proxy(trackers, {
    get: (target, prop) => {
      try {
        return target.get(prop);
      } catch (_) {
      }
      return undefined;
    },
  });
}
