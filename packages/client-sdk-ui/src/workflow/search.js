import { API } from '@miso.ai/commons';
import Workflow from './base.js';
import { mergeApiOptions } from './options.js';
import { fields } from '../actor/index.js';
import { ROLE } from '../constants.js';
import { ListLayout, SearchBoxLayout } from '../layout/index.js';

const DEFAULT_API_OPTIONS = Object.freeze({
  group: API.GROUP.SEARCH,
  name: API.NAME.SEARCH,
  payload: {
    fl: ['*'],
  },
});

const DEFAULT_LAYOUTS = Object.freeze({
  [ROLE.QUERY]: SearchBoxLayout.type,
  [ROLE.PRODUCTS]: ListLayout.type,
});

const DEFAULT_TRACKERS = Object.freeze({
  [ROLE.PRODUCTS]: {},
});

const DEFAULT_OPTIONS = Object.freeze({
  api: DEFAULT_API_OPTIONS,
  layouts: DEFAULT_LAYOUTS,
  trackers: DEFAULT_TRACKERS,
});

export default class Search extends Workflow {

  constructor(plugin, client) {
    super({
      name: 'search',
      plugin,
      client,
      roles: Object.keys(DEFAULT_LAYOUTS),
      defaults: DEFAULT_OPTIONS,
    });

    this._unsubscribes.push(this._hub.on(fields.query(), payload => this.query(payload)));
  }

  // lifecycle //
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

  query(payload) {
    this.restart();
    const { session } = this;
    this._hub.update(fields.request(), mergeApiOptions(this._options.resolved.api, { payload, session }));
    return this;
  }

  notifyViewUpdate(role = ROLE.PRODUCTS, ...args) {
    super.notifyViewUpdate(role, ...args);
    return this;
  }

}
