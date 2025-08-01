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
  REASONING: 'reasoning',
  IMAGES: 'images',
  SOURCES: 'sources',
  RELATED_RESOURCES: 'related_resources',
  FOLLOW_UP_QUESTIONS: 'follow_up_questions',
  QUERY_SUGGESTIONS: 'query_suggestions',
  RELATED_QUESTIONS: 'related_questions',
  AFFILIATION: 'affiliation',
  KEYWORDS: 'keywords',
  FACETS: 'facets',
  TOTAL: 'total',
  MORE: 'more',
  SORT: 'sort',
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
  ROLE.REASONING,
  ROLE.IMAGES,
  ROLE.SOURCES,
  ROLE.RELATED_RESOURCES,
  ROLE.FOLLOW_UP_QUESTIONS,
  ROLE.QUERY_SUGGESTIONS,
  ROLE.RELATED_QUESTIONS,
  ROLE.AFFILIATION,
  ROLE.FACETS,
  ROLE.TOTAL,
]);

export function isDataRole(role) {
  return DATA_ROLE_SET.has(role);
}

const PRODUCT_ROLE_SET = new Set([
  ROLE.PRODUCTS,
  ROLE.IMAGES,
  ROLE.SOURCES,
  ROLE.RELATED_RESOURCES,
]);

export function isProductRole(role) {
  return PRODUCT_ROLE_SET.has(role);
}

export const EVENT_TYPE = Object.freeze({
  IMPRESSION: 'impression',
  VIEWABLE: 'viewable',
  CLICK: 'click',
  SUBMIT: 'submit',
  FEEDBACK: 'feedback',
});

export const TRACKING_EVENT_TYPES = [
  EVENT_TYPE.IMPRESSION,
  EVENT_TYPE.VIEWABLE,
  EVENT_TYPE.CLICK,
  EVENT_TYPE.SUBMIT,
  EVENT_TYPE.FEEDBACK,
];

export const PERFORMANCE_EVENT_TYPES = [
  EVENT_TYPE.IMPRESSION,
  EVENT_TYPE.VIEWABLE,
  EVENT_TYPE.CLICK,
];

const PERFORMANCE_EVENT_TYPE_SET = new Set(PERFORMANCE_EVENT_TYPES);

export function isPerformanceEventType(type) {
  return PERFORMANCE_EVENT_TYPE_SET.has(type);
}

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
  UNANSWERABLE: 'unanswerable',
});

export const QUESTION_SOURCE = Object.freeze({
  ORGANIC: '_organic',
  SUGGESTED_QUESTIONS: '_suggested_questions',
  INLINE_QUESTION_LINK: '_inline_question_link',
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

export const WORKFLOW_CONFIGURABLE = Object.freeze({
  API: 'api',
  LAYOUTS: 'layouts',
  DATA_PROCESSOR: 'dataProcessor',
  TRACKERS: 'trackers',
  INTERACTIONS: 'interactions',
  FILTERS: 'filters',
  PAGINATION: 'pagination',
  TEMPLATES: 'templates',
});
