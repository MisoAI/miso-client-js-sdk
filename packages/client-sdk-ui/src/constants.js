// workflow-level constants live in the workflow package; re-exported here for convenience
export {
  DEFAULT_UNIT_ID,
  ROLE,
  isDataRole,
  isProductRole,
  EVENT_TYPE,
  TRACKING_EVENT_TYPES,
  PERFORMANCE_EVENT_TYPES,
  DIRECT_TRACKING_EVENT_TYPES,
  isPerformanceEventType,
  TRACKING_STATUS,
  STATUS,
  QUESTION_SOURCE,
  validateEventType,
  validateTrackingStatus,
  WORKFLOW_CONFIGURABLE,
  REQUEST_TYPE,
} from '@miso.ai/client-sdk-workflow';

export const ATTR_DATA_MISO_UNIT_ID = `data-miso-unit-id`;
export const ATTR_DATA_MISO_PRODUCT_ID = `data-miso-product-id`;

export const LAYOUT_TYPE = Object.freeze({
  CONTAINER: 'container',
  ERROR: 'error',
  BANNER: 'banner',
  AFFILIATION: 'affiliation',
  LIST: 'list',
  THREADS: 'threads',
  MESSAGES: 'messages',
  HORIZONTAL: 'horizontal',
  CARDS: 'cards',
  CAROUSEL: 'carousel',
  GALLERY: 'gallery',
  SEARCH_BOX: 'search-box',
  OPTION_LIST: 'option-list',
  FACETS: 'facets',
  SELECT: 'select',
  MORE_BUTTON: 'more-button',
  FEEDBACK: 'feedback',
  TEXT: 'text',
  TYPEWRITER: 'typewriter',
});
