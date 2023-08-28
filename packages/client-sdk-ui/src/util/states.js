import { asArray, computeIfAbsent } from '@miso.ai/commons';
import { EVENT_TYPE, TRACKING_STATUS, validateEventType, validateTrackingStatus } from '../constants.js';

const { IMPRESSION, VIEWABLE, CLICK } = EVENT_TYPE;
const { UNTRACKED, TRIGGERED } = TRACKING_STATUS;

/**
 * Tracking states for a session to keep track of the tracking status of each product.
 * For each entry there are status of impression, viewable, and click events. 
 * The actual click tracking status depends on the presence of root element, which is not respected in this object.
 */
export default class States {

  static NEW = {
    [IMPRESSION]: UNTRACKED,
    [VIEWABLE]: UNTRACKED,
  };

  static UNTRACKED = Object.freeze({
    [IMPRESSION]: UNTRACKED,
    [VIEWABLE]: UNTRACKED,
    [CLICK]: UNTRACKED,
  });

  constructor(sessionId) {
    this.sessionId = sessionId;
    this._states = new Map(); // productId -> {impression, viewable, click}
  }

  getFullState(productId) {
    // when we receive a bind event, impression is trigger, making an entry here
    // so if the state is not found, the product is not present yet => all untracked
    const state = this._states.get(productId);
    return state ? { ...state } : States.UNTRACKED;
  }

  get(productId, type) {
    const state = this._states.get(productId);
    return state && state[type] || UNTRACKED;
  }

  set(productIds, type, status) {
    validateEventType(type);
    validateTrackingStatus(status);
    for (const productId of asArray(productIds)) {
      this._setOne(productId, type, status);
    }
  }

  _setOne(productId, type, status) {
    // leave click untracked/tracking judged by its global state
    computeIfAbsent(this._states, productId, () => ({ ...States.NEW }))[type] = status;
  }

  untriggered(productIds, type) {
    return productIds.filter(productId => this.get(productId, type) !== TRIGGERED);
  }

}
