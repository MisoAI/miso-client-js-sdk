export const ATTR_DATA_MISO_UNIT_ID = `data-miso-unit-id`;
export const ATTR_DATA_MISO_PRODUCT_ID = `data-miso-product-id`;
export const DEFAULT_UNIT_ID = 'default';

export const ROLE = Object.freeze({
  CONTAINER: 'container',
  BANNER: 'banner',
  QUERY: 'query',
  FEEDBACK: 'feedback',
  RESULTS: 'results',
  ITEMS: 'items',
  QUESTION: 'question',
  ANSWER: 'answer',
  SOURCES: 'sources',
  RELATED_RESOURCES: 'related-resources',
});

export const LAYOUT_CATEGORY = Object.freeze({
  CONTAINER: 'container',
  BANNER: 'banner',
  LIST: 'list',
  QUERY: 'query',
  RADIO: 'radio',
  TEXT: 'text',
});

export const EVENT_TYPE = Object.freeze({
  IMPRESSION: 'impression',
  VIEWABLE: 'viewable',
  CLICK: 'click',
});

export const TRACKING_STATUS = Object.freeze({
  UNTRACKED: 'untracked',
  TRACKING: 'tracking',
  TRIGGERED: 'triggered',
});

export const STATUS = Object.freeze({
  INITIAL: 'initial',
  LOADING: 'loading',
  ERRONEOUS: 'erroneous',
  READY: 'ready',
});

// TODO: per workflow
/*
const ROLE_TO_LAYOUT_CATEGORY = Object.freeze({
  [ROLE.RESULTS]: LAYOUT_CATEGORY.LIST,
  [ROLE.QUERY]: LAYOUT_CATEGORY.QUERY,
  [ROLE.ANSWER]: LAYOUT_CATEGORY.TEXT,
});

export function getLayoutCategoryByRole(role) {
  const category = ROLE_TO_LAYOUT_CATEGORY[role];
  if (!category) {
    throw new Error(`Unrecognized role: ${role}`);
  }
  return category;
}
*/

export function validateEventType(value) {
  if (value !== EVENT_TYPE.IMPRESSION && value !== EVENT_TYPE.VIEWABLE && value !== EVENT_TYPE.CLICK) {
    throw new Error(`Unrecognized event type: ${value}`);
  }
}

export function validateTrackingStatus(value) {
  if (value !== TRACKING_STATUS.UNTRACKED && value !== TRACKING_STATUS.TRACKING && value !== TRACKING_STATUS.TRIGGERED) {
    throw new Error(`Unrecognized tracking status: ${value}`);
  }
}
