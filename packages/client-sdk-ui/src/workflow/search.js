import { API } from '@miso.ai/commons';
import * as sources from '../source.js';
import { fields, AutocompleteActor } from '../actor/index.js';
import { ROLE, DATA_ASPECT } from '../constants.js';
import { makeConfigurable } from './options.js';
import SearchBasedWorkflow from './search-based.js';

const DEFAULT_API_OPTIONS = Object.freeze({
  group: API.GROUP.SEARCH,
  name: API.NAME.SEARCH,
  payload: {
    fl: ['*'],
  },
});

const DEFAULT_AUTOCOMPLETE_OPTIONS = Object.freeze({
  actor: false,
  api: {
    group: API.GROUP.SEARCH,
    name: API.NAME.AUTOCOMPLETE,
    payload: {
      completion_fields: ['suggested_queries', 'title'],
      fl: ['title', 'url', 'cover_image'],
    },
  },
  throttle: 300,
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

const ROLES_CONFIG = Object.freeze({
  members: Object.keys(DEFAULT_LAYOUTS),
  main: ROLE.PRODUCTS,
});

const ROLES_OPTIONS = SearchBasedWorkflow.ROLES_OPTIONS;

export default class Search extends SearchBasedWorkflow {

  constructor(plugin, client) {
    super({
      name: 'search',
      plugin,
      client,
      roles: ROLES_OPTIONS,
      rolesMembers: Object.keys(DEFAULT_LAYOUTS),
      rolesConfig: ROLES_CONFIG,
      defaults: DEFAULT_OPTIONS,
    });
  }

  _initActors(args) {
    super._initActors(args);
    this._autocomplete = new AutocompleteActor(this._hub, {
      source: sources.api(this._client),
      options: this._options,
    });
  }

  autoQuery({ setValue = true, focus = true } = {}) {
    const q = new URLSearchParams(window.location.search).get('q');
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

  updateCompletions(event) {
    // TODO: verify
    this._hub.update(fields.data(DATA_ASPECT.AUTOCOMPLETE), {
      ...event,
      source: 'manual',
    });
    return this;
  }

  notifyViewUpdate(role = ROLE.PRODUCTS, ...args) {
    super.notifyViewUpdate(role, ...args);
    return this;
  }

}

makeConfigurable(Search.prototype, ['autocomplete']);
