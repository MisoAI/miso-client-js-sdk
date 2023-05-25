import Workflow from './base';
import { fields } from '../actor';
import { ROLE } from '../constants';
import { ListLayout, SearchBoxLayout } from '../layout';
import { mergeApiParams } from './utils';

const DEFAULT_API_PARAMS = Object.freeze({
  group: 'search',
  name: 'search',
  payload: {
    fl: ['*'],
  },
});

const DEFAULT_LAYOUTS = Object.freeze({
  [ROLE.QUERY]: SearchBoxLayout.type,
  [ROLE.RESULTS]: ListLayout.type,
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

  // lifecycle //
  query(payload) {
    this._sessions.new();
    this._sessions.start();
    this._hub.update(fields.input(), mergeApiParams(this._apiParams, { payload }));
    return this;
  }

  notifyViewUpdate(role = ROLE.RESULTS, ...args) {
    super.notifyViewUpdate(role, ...args);
    return this;
  }

}
