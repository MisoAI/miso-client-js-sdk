import { defineValues } from '@miso.ai/commons';
import Workflow from './base';
import { fields, Tracker } from '../actor';
import { ListLayout } from '../layout';
import { ROLE } from '../constants';

const DEFAULT_API_PARAMS = Object.freeze({
  group: 'recommendation',
  name: 'user_to_products',
  payload: {
    fl: ['*'],
  },
});

const DEFAULT_LAYOUTS = Object.freeze({
  [ROLE.RESULTS]: ListLayout.type,
});

export default class Recommendation extends Workflow {

  constructor(context, id) {
    super(context._plugin, context._client, {
      name: 'recommendation',
      roles: Object.keys(DEFAULT_LAYOUTS),
      layouts: DEFAULT_LAYOUTS,
      defaultApiParams: DEFAULT_API_PARAMS,
    });
    this._tracker = new Tracker(this._hub, this._views.get(ROLE.RESULTS));

    defineValues(this, { id });
    this._context = context;

    context._members.set(id, this);
  }

  get tracker() {
    return this._tracker;
  }

  // lifecycle //
  start() {
    this._sessions.start();
    // in recommendation workflow, start() triggers query
    // TODO: we should still make the query lifecycle
    const { session } = this;
    this._hub.update(fields.input(), { ...this._apiParams, session });
    return this;
  }

  startTracker() {
    this.useApi(false);
    this.useLayouts({
      [ROLE.RESULTS]: false,
    });
    this._sessions.start();
    this.notifyViewUpdate(ROLE.RESULTS);
    return this;
  }

  notifyViewUpdate(role = ROLE.RESULTS, ...args) {
    super.notifyViewUpdate(role, ...args);
    return this;
  }

  // tracker //
  useTracker(options) {
    this._tracker.config(options);
    return this;
  }

  // interactions //
  _preprocessInteraction({ context : { custom_context, ...context } = {}, ...payload } = {}) {
    const { uuid, id } = this;
    return {
      ...payload,
      context: {
        ...context,
        custom_context: {
          unit_id: id,
          unit_instance_uuid: uuid,
          ...custom_context,
        },
      },
    };
  }

  // destroy //
  _destroy() {
    this._context._members.delete(this.id);
    this._tracker._destroy();
    super._destroy();
  }

}
