import { API } from '@miso.ai/client-sdk-core';
import Workflow from './base.js';
import { fields, Tracker } from '../actor/index.js';
import { ROLE } from '../constants.js';
import { ListLayout } from '../layout/index.js';

const DEFAULT_API_PARAMS = Object.freeze({
  group: API.GROUP.ASK,
  name: API.NAME.RELATED_QUESTIONS,
});

const DEFAULT_LAYOUTS = Object.freeze({
  [ROLE.RELATED_QUESTIONS]: [ListLayout.type, { itemType: 'question' }],
});

export default class Explore extends Workflow {

  constructor(plugin, client) {
    super(plugin, client, {
      name: 'explore',
      roles: Object.keys(DEFAULT_LAYOUTS),
      layouts: DEFAULT_LAYOUTS,
      defaultApiParams: DEFAULT_API_PARAMS,
    });
    this._productId = undefined;
    this._linkFn = undefined;
    this._tracker = new Tracker(this._hub, this._views.get(ROLE.RELATED_QUESTIONS));
    this._unsubscribes.push(this._views.get(ROLE.RELATED_QUESTIONS).on('click', event => this._handleQuestionClick(event)));
  }

  get tracker() {
    return this._tracker;
  }

  get productId() {
    return this._productId;
  }

  set productId(value) {
    this._productId = value;
  }

  useLink(fn) {
    if (typeof fn !== 'function' && fn !== false) {
      throw new Error('useLink(fn) expects fn to be a function or false');
    }
    this._linkFn = fn;
    return this;
  }

  // lifecycle //
  start() {
    if (!this._productId) {
      throw new Error('Set productId before calling start()');
    }
    if (this._linkFn === undefined) {
      throw new Error('Define link mapping function before calling start()');
    }
    this._sessions.start();
    // in explore workflow, start() triggers query
    // TODO: we should still make the query lifecycle
    const { session } = this;
    this._hub.update(fields.request(), {
      ...this._apiParams,
      payload: {
        ...this._apiParams.payload,
        product_id: this._productId,
      },
      session,
    });
    return this;
  }

  notifyViewUpdate(role = ROLE.RELATED_QUESTIONS, ...args) {
    super.notifyViewUpdate(role, ...args);
    return this;
  }

  _defaultProcessData(data) {
    data = super._defaultProcessData(data);
    let { value } = data;
    if (!value) {
      return data;
    }
    // patch value with links
    const related_questions = value.related_questions.map(this._linkFn ? (text => ({ text, url: this._linkFn(text) })) : (text => ({ text })));
    return {
      ...data,
      value: {
        ...value,
        related_questions,
      },
    };
  }

  _handleQuestionClick({ value: question, ...event }) {
    this._events.emit('select', Object.freeze({ ...event, question }));
  }

  // tracker //
  useTracker(options) {
    this._tracker.config(options);
    return this;
  }

  // destroy //
  _destroy() {
    this._tracker._destroy();
    super._destroy();
  }

}
