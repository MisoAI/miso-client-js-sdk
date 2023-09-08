export const ATTR_DATA_MISO_UNIT_ID = `data-miso-unit-id`;
export const ATTR_DATA_MISO_PRODUCT_ID = `data-miso-product-id`;
export const DEFAULT_UNIT_ID = 'default';

export const ROLE = Object.freeze({
  CONTAINER: 'container',
  BANNER: 'banner',
  QUERY: 'query',
  FEEDBACK: 'feedback',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  ATTRIBUTES: 'attributes',
  RESULTS: 'results',
  ITEMS: 'items',
  QUESTION: 'question',
  ANSWER: 'answer',
  SOURCES: 'sources',
  RELATED_RESOURCES: 'related_resources',
  QUERY_SUGGESTIONS: 'query_suggestions',
  RELATED_QUESTIONS: 'related_questions',
  ERROR: 'error',
});

export const LAYOUT_CATEGORY = Object.freeze({
  CONTAINER: 'container',
  BANNER: 'banner',
  LIST: 'list',
  QUERY: 'query',
  RADIO: 'radio',
  TEXT: 'text',
  ERROR: 'error',
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
