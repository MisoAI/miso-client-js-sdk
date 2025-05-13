import { API } from '@miso.ai/commons';
import UnitWorkflow from './unit.js';
import { ListLayout } from '../layout/index.js';
import { ROLE } from '../constants.js';
import { mergeRolesOptions, DEFAULT_TRACKER_OPTIONS } from './options/index.js';

const DEFAULT_API_OPTIONS = Object.freeze({
  ...UnitWorkflow.DEFAULT_API_OPTIONS,
  group: API.GROUP.RECOMMENDATION,
  name: API.NAME.USER_TO_PRODUCTS,
  payload: {
    ...UnitWorkflow.DEFAULT_API_OPTIONS.payload,
    fl: ['*'],
  },
});

const DEFAULT_LAYOUTS = Object.freeze({
  ...UnitWorkflow.DEFAULT_LAYOUTS,
  [ROLE.PRODUCTS]: ListLayout.type,
});

const DEFAULT_TRACKERS = Object.freeze({
  ...UnitWorkflow.DEFAULT_TRACKERS,
  [ROLE.PRODUCTS]: DEFAULT_TRACKER_OPTIONS,
});

const DEFAULT_OPTIONS = Object.freeze({
  ...UnitWorkflow.DEFAULT_OPTIONS,
  api: DEFAULT_API_OPTIONS,
  layouts: DEFAULT_LAYOUTS,
  trackers: DEFAULT_TRACKERS,
});

const ROLES_OPTIONS = mergeRolesOptions(UnitWorkflow.ROLES_OPTIONS, {
  main: ROLE.PRODUCTS,
  members: Object.keys(DEFAULT_LAYOUTS),
});

export default class Recommendation extends UnitWorkflow {

  constructor(context, id) {
    super({
      name: 'recommendation',
      context,
      roles: ROLES_OPTIONS,
      defaults: DEFAULT_OPTIONS,
      id,
    });
  }

  // lifecycle //
  start() {
    // in recommendation workflow, start() triggers query
    this._request();
    return this;
  }

  notifyViewUpdate(role = ROLE.PRODUCTS, ...args) {
    super.notifyViewUpdate(role, ...args);
    return this;
  }

}
