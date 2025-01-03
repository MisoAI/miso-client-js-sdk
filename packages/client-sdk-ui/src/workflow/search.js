import { API } from '@miso.ai/commons';
import { fields } from '../actor/index.js';
import { ROLE } from '../constants.js';
import { makeConfigurable } from './options.js';
import SearchBasedWorkflow from './search-based.js';
import Autocomplete from './autocomplete.js';

const DEFAULT_API_OPTIONS = Object.freeze({
  group: API.GROUP.SEARCH,
  name: API.NAME.SEARCH,
  payload: {
    fl: ['*'],
  },
});

const DEFAULT_AUTOCOMPLETE_OPTIONS = Object.freeze({
  active: false,
  api: {
    group: API.GROUP.SEARCH,
    name: API.NAME.AUTOCOMPLETE,
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
    this._autocomplete = new Autocomplete(this, { defaults: DEFAULT_AUTOCOMPLETE_OPTIONS});
  }

  get autocomplete() {
    return this._autocomplete;
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

  updateCompletions(data) {
    this._hub.update(fields.completions(), data);
    return this;
  }

  notifyViewUpdate(role = ROLE.PRODUCTS, ...args) {
    super.notifyViewUpdate(role, ...args);
    return this;
  }

}
