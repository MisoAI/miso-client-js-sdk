import { defineValues, API } from '@miso.ai/commons';
import Workflow from './base.js';
import { ListLayout } from '../layout/index.js';
import { ROLE } from '../constants.js';
import { mergeRolesOptions } from './options/index.js';
import { mergeInteraction } from './processors.js';

const DEFAULT_API_OPTIONS = Object.freeze({
  ...Workflow.DEFAULT_API_OPTIONS,
  group: API.GROUP.RECOMMENDATION,
  name: API.NAME.USER_TO_PRODUCTS,
  payload: {
    ...Workflow.DEFAULT_API_OPTIONS.payload,
    fl: ['*'],
  },
});

const DEFAULT_LAYOUTS = Object.freeze({
  ...Workflow.DEFAULT_LAYOUTS,
  [ROLE.PRODUCTS]: ListLayout.type,
});

const DEFAULT_TRACKERS = Object.freeze({
  ...Workflow.DEFAULT_TRACKERS,
  [ROLE.PRODUCTS]: {},
});

const DEFAULT_OPTIONS = Object.freeze({
  ...Workflow.DEFAULT_OPTIONS,
  api: DEFAULT_API_OPTIONS,
  layouts: DEFAULT_LAYOUTS,
  trackers: DEFAULT_TRACKERS,
});

const ROLES_OPTIONS = mergeRolesOptions(Workflow.ROLES_OPTIONS, {
  main: ROLE.PRODUCTS,
  members: Object.keys(DEFAULT_LAYOUTS),
});

export default class Recommendation extends Workflow {

  constructor(context, id) {
    super({
      name: 'recommendation',
      context,
      roles: ROLES_OPTIONS,
      defaults: DEFAULT_OPTIONS,
      id,
    });
  }

  _initProperties(args) {
    super._initProperties(args);
    const { id } = args;
    defineValues(this, { id });
  }

  _initSession(args) {
    this._context._members.set(args.id, this);
    super._initSession(args);
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

  // interactions //
  _defaultProcessInteraction(payload, args) {
    payload = super._defaultProcessInteraction(payload, args);
    payload = this._writeUnitIdToInteraction(payload, args);
    return payload;
  }

  _writeUnitIdToInteraction(payload) {
    const unit_id = this.id;
    const unit_instance_uuid = this.uuid;
    return mergeInteraction(payload, {
      context: {
        custom_context: {
          unit_id,
          unit_instance_uuid,
        },
      },
    });
  }

  // destroy //
  _destroy(options) {
    this._context._members.delete(this.id);
    super._destroy(options);
  }

}
