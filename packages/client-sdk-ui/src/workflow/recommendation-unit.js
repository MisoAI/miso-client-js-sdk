import { defineValues, isElement } from '@miso.ai/commons';
import Workflow from './base';
import { Tracker, fields } from '../saga';
import { ListLayout } from '../layout';
import { ROLE } from '../constants';

const DEFAULT_LAYOUT = ListLayout.type;
const DEFAULT_API_PARAMS = Object.freeze({
  group: 'recommendation',
  name: 'user_to_products',
  payload: {
    fl: ['*'],
  },
});

export default class RecommendationUnit extends Workflow {

  constructor(context, id) {
    super(context._plugin, context._client, {
      name: 'recommendation',
      roles: [ROLE.RESULTS],
      defaultApiParams: DEFAULT_API_PARAMS,
    })

    defineValues(this, { id });
    this._context = context;
    this._tracker = new Tracker(this._saga);

    this._unsubscribe = [
      this._saga.on('event', event => this._handleEvent(event)),
    ];

    context._units.set(id, this);

    this.useLayout(DEFAULT_LAYOUT);
  }

  get tracker() {
    return this._tracker;
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
  reset() {
    this._sessions.new();
    return this;
  }

  start() {
    this._sessions.start();
    this._saga.update(fields.input(), this._apiParams);
    return this;
  }

  startTracker() {
    this.useSource(false);
    this.useLayout(false);
    this._sessions.start();
    this.notifyViewUpdate(ROLE.RESULTS);
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

  // TODO: make interactions a saga component?
  _handleEvent(event) {
    this._assertActive();
    const { uuid, id } = this;
    this._context.interactions._send({ uuid, id }, event);
  }

  // destroy //
  _destroy() {
    this._tracker._destroy();
    super._destroy();
  }

}
