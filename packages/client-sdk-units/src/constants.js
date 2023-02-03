export const ATTR_UNIT_ID = 'data-miso-unit-id';
export const ATTR_PRODUCT_ID = 'data-miso-product-id';

export const EVENT_TYPE = Object.freeze({
  IMPRESSION: 'impression',
  VIEWABLE: 'viewable',
  CLICK: 'click',
});

export const TRACKING_STATE = Object.freeze({
  UNTRACKED: 'untracked',
  TRACKING: 'tracking',
  TRIGGERED: 'triggered',
});

export function validateEventType(value) {
  if (value !== EVENT_TYPE.IMPRESSION && value !== EVENT_TYPE.VIEWABLE && value !== EVENT_TYPE.CLICK) {
    throw new Error(`Unrecognized event type: ${value}`);
  }
}

export function validateTrackingState(value) {
  if (value !== TRACKING_STATE.UNTRACKED && value !== TRACKING_STATE.TRACKING && value !== TRACKING_STATE.TRIGGERED) {
    throw new Error(`Unrecognized tracking state: ${value}`);
  }
}
