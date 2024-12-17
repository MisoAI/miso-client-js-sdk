import { defineValues, trimObj, API } from '@miso.ai/commons';
import Workflow from './base.js';
import { fields } from '../actor/index.js';
import { ListLayout } from '../layout/index.js';
import { ROLE } from '../constants.js';

const DEFAULT_API_OPTIONS = Object.freeze({
  group: API.GROUP.RECOMMENDATION,
  name: API.NAME.USER_TO_PRODUCTS,
  payload: {
    fl: ['*'],
  },
});

const DEFAULT_LAYOUTS = Object.freeze({
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

export default class Recommendation extends Workflow {

  constructor(context, id) {
    super({
      name: 'recommendation',
      context,
      roles: Object.keys(DEFAULT_LAYOUTS),
      defaults: DEFAULT_OPTIONS,
      id,
    });
  }

  _initProperties(args) {
    super._initProperties(args);
    const { id } = args;
    defineValues(this, { id });
  }

  _initReset(args) {
    this._context._members.set(args.id, this);
    super._initReset(args);
  }

  // lifecycle //
  start() {
    this._sessions.start();
    // in recommendation workflow, start() triggers query
    // TODO: we should still make the query lifecycle
    this._request();
    return this;
  }

  notifyViewUpdate(role = ROLE.PRODUCTS, ...args) {
    super.notifyViewUpdate(role, ...args);
    return this;
  }

  // interactions //
  _preprocessInteraction(payload) {
    payload = super._preprocessInteraction(payload) || {};
    const { context = {} } = payload;
    const { custom_context = {} } = context;
    return {
      ...payload,
      context: {
        ...context,
        custom_context: trimObj({
          unit_id: this.id,
          unit_instance_uuid: this.uuid,
          ...custom_context,
        }),
      },
    };
  }

  // destroy //
  _destroy(options) {
    this._context._members.delete(this.id);
    super._destroy(options);
  }

}
