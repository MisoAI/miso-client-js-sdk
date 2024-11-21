export const ATTR_DATA_MISO_UNIT_ID = `data-miso-unit-id`;
export const ATTR_DATA_MISO_PRODUCT_ID = `data-miso-product-id`;
export const DEFAULT_UNIT_ID = 'default';
export const ORGANIC_QUESTION_SOURCE = '_organic';

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
  AFFILIATION: 'affiliation',
  KEYWORDS: 'keywords',
  FACETS: 'facets',
  HITS: 'hits',
  ERROR: 'error',
});

const DATA_ROLE_SET = new Set([
  ROLE.PRODUCTS,
  ROLE.CATEGORIES,
  ROLE.ATTRIBUTES,
  ROLE.RESULTS,
  ROLE.ITEMS,
  ROLE.QUESTION,
  ROLE.ANSWER,
  ROLE.SOURCES,
  ROLE.RELATED_RESOURCES,
  ROLE.QUERY_SUGGESTIONS,
  ROLE.RELATED_QUESTIONS,
  ROLE.AFFILIATION,
  ROLE.FACETS,
  ROLE.HITS,
]);

export function isDataRole(role) {
  return DATA_ROLE_SET.has(role);
}

export const DATA_ASPECT = Object.freeze({
  AUTOCOMPLETE: 'autocomplete',
});

export const LAYOUT_CATEGORY = Object.freeze({
  CONTAINER: 'container',
  BANNER: 'banner',
  LIST: 'list',
  QUERY: 'query',
  RADIO: 'radio',
  FILTERS: 'filters',
  TEXT: 'text',
  AFFILIATION: 'affiliation',
  ERROR: 'error',
});

export const EVENT_TYPE = Object.freeze({
  IMPRESSION: 'impression',
  VIEWABLE: 'viewable',
  CLICK: 'click',
  SUBMIT: 'submit',
});

export const TRACKING_EVENT_TYPES = [
  EVENT_TYPE.IMPRESSION,
  EVENT_TYPE.VIEWABLE,
  EVENT_TYPE.CLICK,
  EVENT_TYPE.SUBMIT,
];

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
  ONGOING: 'ongoing',
  DONE: 'done',
  EMPTY: 'empty',
  NONEMPTY: 'nonempty',
});

export function validateEventType(value) {
  if (TRACKING_EVENT_TYPES.indexOf(value) < 0) {
    throw new Error(`Unrecognized event type: ${value}`);
  }
}

export function validateTrackingStatus(value) {
  if (value !== TRACKING_STATUS.UNTRACKED && value !== TRACKING_STATUS.TRACKING && value !== TRACKING_STATUS.TRIGGERED) {
    throw new Error(`Unrecognized tracking status: ${value}`);
  }
}
