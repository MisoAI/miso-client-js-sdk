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

export default class RecommendationUnit extends Workflow {

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

    //this._unsubscribes.push(this._hub.on('event', event => this._handleEvent(event)));

    context._units.set(id, this);
  }

  get tracker() {
    return this._tracker;
  }

  // lifecycle //
  reset() {
    this._sessions.new();
    return this;
  }

  start() {
    this._sessions.start();
    this._hub.update(fields.input(), this._apiParams);
    return this;
  }

  startTracker() {
    this.useSource(false);
    this.useLayout(false);
    this._sessions.start();
    this.notifyViewUpdate(ROLE.RESULTS);
    return this;
  }

  notifyViewUpdate(role = ROLE.RESULTS, ...args) {
    super.notifyViewUpdate(role, ...args);
    return this;
  }

  // layout //
  useLayout(layout, options) {
    this.useLayouts({
      [ROLE.RESULTS]: [layout, options],
    });
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

  /*
  // TODO: make interactions an actor?
  _handleEvent(event) {
    this._assertActive();
    const { uuid, id } = this;
    this._context.interactions._send({ uuid, id }, event);
  }
  */

  // destroy //
  _destroy() {
    this._tracker._destroy();
    super._destroy();
  }

}
