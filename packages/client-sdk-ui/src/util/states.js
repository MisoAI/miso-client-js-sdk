import { asArray, computeIfAbsent } from '@miso.ai/commons';
import { EVENT_TYPE, TRACKING_STATUS, validateEventType, validateTrackingStatus } from '../constants.js';

const { IMPRESSION, VIEWABLE, CLICK } = EVENT_TYPE;
const { UNTRACKED, TRIGGERED } = TRACKING_STATUS;

/*
const STATES = {
  NEW: Object.freeze({
    [IMPRESSION]: UNTRACKED,
    [VIEWABLE]: UNTRACKED,
  }),
  UNTRACKED: Object.freeze({
    [IMPRESSION]: UNTRACKED,
    [VIEWABLE]: UNTRACKED,
    [CLICK]: UNTRACKED,
  }),
};
*/

const UNTRACKED_STATES = Object.freeze({
  [IMPRESSION]: UNTRACKED,
  [VIEWABLE]: UNTRACKED,
  [CLICK]: UNTRACKED,
});

/**
 * Tracking states for a session to keep track of the tracking status of each product.
 * For each entry there are status of impression, viewable, and click events.
 */
export default class States {

  constructor(sessionId) {
    this.sessionId = sessionId;
    this._states = new Map(); // item key -> {impression, viewable, click}
  }

  getFullState(item) {
    // when we receive a bind event, impression is trigger, making an entry here
    // so if the state is not found, the product is not present yet => all untracked
    const state = this._states.get(this._getKey(item));
    return state ? { ...state } : UNTRACKED_STATES;
  }

  get(item, type) {
    const state = this._states.get(this._getKey(item));
    return state && state[type] || UNTRACKED;
  }

  set(items, type, status) {
    validateEventType(type);
    validateTrackingStatus(status);
    for (const item of asArray(items)) {
      this._setOne(item, type, status);
    }
  }

  untriggered(items, type) {
    return items.filter(item => this.get(item, type) !== TRIGGERED);
  }

  _getKey(item) {
    // TODO: ad-hoc! should move away to higher level
    return item.product_id || item.text || item.id || item;
  }

  _setOne(item, type, status) {
    computeIfAbsent(this._states, this._getKey(item), () => ({ ...UNTRACKED_STATES }))[type] = status;
  }

}
