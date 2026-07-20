import { API } from '@miso.ai/commons';
import { EVENT_TYPE } from './constants.js';
import { DEFAULT_TRACKER_OPTIONS } from './workflow/options/index.js';

/**
 * Default options (except layouts) of each workflow, keyed by workflow name.
 * The workflow plugin seeds its defaults store with these values. Default
 * layout options are seeded by the UI plugin instead.
 *
 * These used to live in the workflow classes; the tables mirror the workflow
 * class hierarchy.
 */

// answer-based (ask, hybrid-search) //
const ANSWER_BASED_API_OPTIONS = {
  group: API.GROUP.ASK,
  payload: {
    source_fl: ['cover_image', 'url', 'created_at', 'updated_at', 'published_at'],
    cite_link: 1,
    cite_start: '[',
    cite_end: ']',
  },
};

const ANSWER_BASED_TRACKERS = {
  answer: {
    active: true,
    itemless: true,
    deduplicated: false,
    click: DEFAULT_TRACKER_OPTIONS.click, // click only
  },
  images: DEFAULT_TRACKER_OPTIONS,
  sources: DEFAULT_TRACKER_OPTIONS,
  affiliation: DEFAULT_TRACKER_OPTIONS,
  products: DEFAULT_TRACKER_OPTIONS,
};

// search-based (search, hybrid-search) //
const SEARCH_BASED_API_OPTIONS = {
  group: API.GROUP.SEARCH,
  payload: {
    fl: ['cover_image', 'url', 'created_at', 'updated_at', 'published_at', 'title'],
    rows: 10,
  },
};

const SEARCH_BASED_TRACKERS = {
  products: DEFAULT_TRACKER_OPTIONS,
};

const SEARCH_BASED_PAGINATION = {
  active: false,
  mode: 'infiniteScroll',
  pageLimit: 10,
};

export default Object.freeze({

  'ask': {
    api: {
      ...ANSWER_BASED_API_OPTIONS,
      name: API.NAME.QUESTIONS,
      payload: {
        ...ANSWER_BASED_API_OPTIONS.payload,
        related_resource_fl: ['cover_image', 'url', 'created_at', 'updated_at', 'published_at'],
      },
    },
    trackers: {
      ...ANSWER_BASED_TRACKERS,
      related_resources: DEFAULT_TRACKER_OPTIONS,
      query_suggestions: {
        ...DEFAULT_TRACKER_OPTIONS,
        click: {
          ...DEFAULT_TRACKER_OPTIONS.click,
          validate: event => event.button === 0, // loosen criteria, for it's not a hyperlink
        },
      },
    },
    autocomplete: {
      api: {
        group: API.GROUP.ASK,
        name: API.NAME.AUTOCOMPLETE,
      },
    },
  },

  'search': {
    api: {
      group: API.GROUP.SEARCH,
      name: API.NAME.SEARCH,
      payload: {
        fl: ['*'],
      },
    },
    trackers: {
      ...SEARCH_BASED_TRACKERS,
    },
    pagination: SEARCH_BASED_PAGINATION,
    autocomplete: {
      api: {
        group: API.GROUP.SEARCH,
        name: API.NAME.AUTOCOMPLETE,
        payload: {
          completion_fields: ['suggested_queries', 'title'],
          fl: ['title', 'url', 'cover_image'],
        },
      },
    },
  },

  'hybrid-search': {
    api: {
      group: API.GROUP.ASK,
      name: API.NAME.SEARCH,
      payload: {
        ...ANSWER_BASED_API_OPTIONS.payload,
        ...SEARCH_BASED_API_OPTIONS.payload,
        source_fl: ['cover_image', 'url', 'created_at', 'updated_at', 'published_at', 'title', 'authors'],
      },
    },
    trackers: {
      ...ANSWER_BASED_TRACKERS,
      ...SEARCH_BASED_TRACKERS,
    },
    pagination: {
      ...SEARCH_BASED_PAGINATION,
      active: true,
    },
    autocomplete: {
      api: {
        group: API.GROUP.ASK,
        name: API.NAME.SEARCH_AUTOCOMPLETE,
        payload: {
          completion_fields: ['suggested_queries'],
        },
      },
    },
    filters: {
      sort: {
        options: [
          { field: 'relevance', text: 'Relevance', default: true },
          { field: 'published_at', text: 'Date' },
        ],
      },
    },
  },

  'recommendation': {
    api: {
      group: API.GROUP.RECOMMENDATION,
      name: API.NAME.USER_TO_PRODUCTS,
      payload: {
        fl: ['*'],
      },
    },
    trackers: {
      products: DEFAULT_TRACKER_OPTIONS,
    },
  },

  'history': {
    api: {
      group: API.GROUP.ASK_USER_HISTORY,
      name: API.NAME.THREADS,
      options: {
        method: 'GET',
      },
    },
  },

  'thread': {
    api: {
      group: API.GROUP.ASK_USER_HISTORY,
      name: API.NAME.THREADS, // `/${threadId}` is appended per request
      options: {
        method: 'GET',
      },
    },
    // the follow-up request retrieving question-answer pair contents
    answers: {
      api: {
        group: API.GROUP.ASK,
        name: API.NAME.ANSWERS,
        options: {
          method: 'POST', // override the GET method of the head request api options
        },
      },
    },
  },

  'explore': {
    api: {
      group: API.GROUP.ASK,
      name: API.NAME.RELATED_QUESTIONS,
    },
    trackers: {
      related_questions: DEFAULT_TRACKER_OPTIONS,
      container: {
        ...DEFAULT_TRACKER_OPTIONS,
        itemless: true,
      },
      query: {
        [EVENT_TYPE.SUBMIT]: {
          active: true,
        },
      },
    },
    autocomplete: {
      api: {
        group: API.GROUP.ASK,
        name: API.NAME.QUERY_SUGGESTION,
      },
    },
  },

});
