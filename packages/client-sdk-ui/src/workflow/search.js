import { API } from '@miso.ai/commons';
import Workflow from './base.js';
import { mergeApi } from './options.js';
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
});

export default class Search extends Workflow {

  constructor(plugin, client) {
    super({
      name: 'search',
      plugin,
      client,
      roles: Object.keys(DEFAULT_LAYOUTS),
      layouts: DEFAULT_LAYOUTS,
      trackers: DEFAULT_TRACKERS,
      defaults: DEFAULT_OPTIONS,
    });

    this._unsubscribes.push(this._hub.on(fields.query(), payload => this.query(payload)));
  }

  // layout //
  useLayouts({ [ROLE.RESULTS]: results, ...layouts } = {}) {
    // fallback
    if (results !== undefined) {
      console.warn(`useLayouts({ ${[ROLE.RESULTS]}: ... }) is deprecated, use useLayouts({ ${[ROLE.PRODUCTS]}: ... }) instead`);
      layouts[ROLE.PRODUCTS] = results;
    }
    super.useLayouts(layouts);
  }

  // lifecycle //
  query(payload) {
    this.restart();
    const { session } = this;
    this._hub.update(fields.request(), mergeApi(this.options.api, { payload, session }));
    return this;
  }

  notifyViewUpdate(role = ROLE.PRODUCTS, ...args) {
    super.notifyViewUpdate(role, ...args);
    return this;
  }

}
