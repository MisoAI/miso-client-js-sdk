import Workflow from './base';
import { fields, FeedbackActor } from '../actor';
import { ROLE } from '../constants';
import { SearchBoxLayout, ListLayout, TextLayout, TypewriterLayout, FeedbackLayout } from '../layout';
import { mergeApiParams } from './utils';

const DEFAULT_API_PARAMS = Object.freeze({
  group: 'ask',
  name: 'questions',
  payload: {
    fl: ['*'],
  },
});

const DEFAULT_LAYOUTS = Object.freeze({
  [ROLE.QUERY]: SearchBoxLayout.type,
  [ROLE.QUESTION]: [TextLayout.type, { tag: 'h3' }],
  [ROLE.ANSWER]: TypewriterLayout.type,
  [ROLE.FEEDBACK]: FeedbackLayout.type,
  [ROLE.SOURCES]: [ListLayout.type, { incremental: true, }],
  [ROLE.RELATED_RESOURCES]: [ListLayout.type, { incremental: true, }],
});

export default class Ask extends Workflow {

  constructor(plugin, client) {
    super(plugin, client, {
      name: 'ask',
      roles: Object.keys(DEFAULT_LAYOUTS),
      layouts: DEFAULT_LAYOUTS,
      defaultApiParams: DEFAULT_API_PARAMS,
    });
    this._feedback = new FeedbackActor(this._hub);

    this._unsubscribes.push(this._hub.on(fields.query(), payload => this.query(payload)));
  }

  // lifecycle //
  query(payload) {
    // TODO: abort previous ongoing query
    this._sessions.new();
    this._sessions.start();
    this._hub.update(fields.input(), mergeApiParams(this._apiParams, { payload }));
    return this;
  }

}
