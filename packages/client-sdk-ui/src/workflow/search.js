import { API } from '@miso.ai/commons';
import { ROLE } from '../constants.js';
import SearchBasedWorkflow from './search-based.js';
import { makeAutocompletable } from './autocompletable.js';

const DEFAULT_API_OPTIONS = Object.freeze({
  group: API.GROUP.SEARCH,
  name: API.NAME.SEARCH,
  payload: {
    fl: ['*'],
  },
});

const DEFAULT_AUTOCOMPLETE_OPTIONS = Object.freeze({
  api: {
    group: API.GROUP.SEARCH,
    name: API.NAME.AUTOCOMPLETE,
    payload: {
      completion_fields: ['suggested_queries', 'title'],
      fl: ['title', 'url', 'cover_image'],
    },
  },
});

const DEFAULT_LAYOUTS = Object.freeze({
  ...SearchBasedWorkflow.DEFAULT_LAYOUTS,
});

const DEFAULT_TRACKERS = Object.freeze({
  ...SearchBasedWorkflow.DEFAULT_TRACKERS,
});

const DEFAULT_OPTIONS = Object.freeze({
  ...SearchBasedWorkflow.DEFAULT_OPTIONS,
  api: DEFAULT_API_OPTIONS,
  autocomplete: DEFAULT_AUTOCOMPLETE_OPTIONS,
  layouts: DEFAULT_LAYOUTS,
  trackers: DEFAULT_TRACKERS,
});

const ROLES_OPTIONS = SearchBasedWorkflow.ROLES_OPTIONS;

export default class Search extends SearchBasedWorkflow {

  constructor(plugin, client) {
    super({
      name: 'search',
      plugin,
      client,
      roles: ROLES_OPTIONS,
      defaults: DEFAULT_OPTIONS,
    });
  }

  _initProperties(args) {
    super._initProperties(args);
    this._initAutocomplete(args);
  }

  autoQuery({ setValue = true, focus = true, param = 'q' } = {}) {
    // TODO: align implementation with AnswerBasedWorkflow
    const q = new URLSearchParams(window.location.search).get(param);
    const { layout } = this._views.get(ROLE.QUERY);
    if (layout) {
      if (q && setValue) {
        layout.value = q;
      }
      if (!q && focus) {
        layout.focus();
      }
    }
    if (q) {
      this.query({ q });
    }
  }

  notifyViewUpdate(role = ROLE.PRODUCTS, ...args) {
    super.notifyViewUpdate(role, ...args);
    return this;
  }

  // destroy //
  _destroy(options) {
    this._feedback._destroy();
    this._destroyAutocomplete();
    super._destroy(options);
  }

}

makeAutocompletable(Search.prototype);
