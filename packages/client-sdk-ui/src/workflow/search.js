import { API } from '@miso.ai/client-sdk-core';
import Workflow from './base.js';
import { fields } from '../actor/index.js';
import { ROLE } from '../constants.js';
import { ListLayout, SearchBoxLayout } from '../layout/index.js';
import { mergeApiParams } from './utils.js';

const DEFAULT_API_PARAMS = Object.freeze({
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

export default class Search extends Workflow {

  constructor(plugin, client) {
    super(plugin, client, {
      name: 'search',
      roles: Object.keys(DEFAULT_LAYOUTS),
      layouts: DEFAULT_LAYOUTS,
      defaultApiParams: DEFAULT_API_PARAMS,
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
    this._hub.update(fields.request(), mergeApiParams(this._apiParams, { payload, session }));
    return this;
  }

  notifyViewUpdate(role = ROLE.PRODUCTS, ...args) {
    super.notifyViewUpdate(role, ...args);
    return this;
  }

}
