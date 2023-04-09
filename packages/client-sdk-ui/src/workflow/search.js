import { isElement } from '@miso.ai/commons';
import Workflow from './base';
import { fields } from '../saga';
import { ListLayout } from '../layout';
import { ROLE } from '../constants';
import { mergeApiParams } from './utils';

const DEFAULT_LAYOUT = ListLayout.type;

const DEFAULT_API_PARAMS = Object.freeze({
  group: 'search',
  name: 'search',
  payload: {
    fl: ['*'],
  },
});

export default class Search extends Workflow {

  constructor(plugin, client) {
    super(plugin, client, {
      name: 'search',
      roles: [ROLE.RESULTS],
      defaultApiParams: DEFAULT_API_PARAMS,
    });

    this.useLayout(DEFAULT_LAYOUT);
  }

  // element //
  get element() {
    return this._saga.elements.get(ROLE.RESULTS);
  }

  bind(role, element) {
    if (element === undefined && isElement(role)) {
      element = role;
      role = ROLE.RESULTS;
    }
    return super.bind(role, element);
  }

  unbind(role = ROLE.RESULTS) {
    return super.unbind(role);
  }

  // lifecycle //
  query(payload) {
    this._sessions.new();
    this._sessions.start();
    this._saga.update(fields.input(), mergeApiParams(this._apiParams, { payload }));
    return this;
  }

  // layout //
  useLayout(layout, options) {
    this.useLayouts({
      [ROLE.RESULTS]: [layout, options],
    });
    return this;
  }

}
