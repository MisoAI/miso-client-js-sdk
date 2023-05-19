import Workflow from './base';
import { fields, FeedbackActor } from '../actor';
import { ROLE } from '../constants';
import { SearchBoxLayout, ListLayout, TextLayout, TypewriterLayout, FeedbackLayout } from '../layout';
import { mergeApiParams } from './utils';

const DEFAULT_API_PARAMS = Object.freeze({
  group: 'ask',
  name: 'questions',
  payload: {
    source_fl: ['cover_image'],
  },
});

const DEFAULT_LAYOUTS = Object.freeze({
  [ROLE.QUERY]: SearchBoxLayout.type,
  [ROLE.QUESTION]: [TextLayout.type, { tag: 'h2' }],
  [ROLE.ANSWER]: TypewriterLayout.type,
  [ROLE.FEEDBACK]: FeedbackLayout.type,
  [ROLE.SOURCES]: [ListLayout.type, { incremental: true, }],
  [ROLE.RELATED_RESOURCES]: [ListLayout.type, { incremental: true, }],
});

export default class Ask extends Workflow {

  constructor(context, index) {
    super(context._plugin, context._client, {
      name: 'ask',
      roles: Object.keys(DEFAULT_LAYOUTS),
      layouts: DEFAULT_LAYOUTS,
      defaultApiParams: DEFAULT_API_PARAMS,
    });
    this._context = context;
    this._context._push(this);
    this._index = index;
    this._feedback = new FeedbackActor(this._hub);
    this._unsubscribes.push(this._hub.on(fields.query(), payload => this.query(payload)));
  }

  // question chain //
  get index() {
    return this._index;
  }

  get previous() {
    return this._context.get(this._index - 1);
  }

  get next() {
    return this._context.get(this._index + 1) || new Ask(this._context, this._index + 1);
  }

  // lifecycle //
  query({ q: question, ...payload } = {}) {
    payload = { ...payload, question };
    // TODO: abort previous ongoing query
    this._sessions.new();
    this._sessions.start();
    this._hub.update(fields.input(), mergeApiParams(this._apiParams, { payload }));
    return this;
  }

  // TODO: destroy() {}

}
