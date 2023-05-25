import { defineValues } from '@miso.ai/commons';
import Workflow from './base';
import { fields, FeedbackActor } from '../actor';
import { ROLE, STATUS } from '../constants';
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

  constructor(context, parentQuestionId) {
    super(context._plugin, context._client, {
      name: 'ask',
      roles: Object.keys(DEFAULT_LAYOUTS),
      layouts: DEFAULT_LAYOUTS,
      defaultApiParams: DEFAULT_API_PARAMS,
    });
    defineValues(this, { parentQuestionId });

    this._feedback = new FeedbackActor(this._hub);
    this._unsubscribes = [
      ...this._unsubscribes,
      this._hub.on(fields.query(), payload => this.query(payload)),
      this._hub.on(fields.data(), data => this._onDataUpdate(data)),
      this._hub.on(fields.view(ROLE.ANSWER), data => this._onAnswerViewUpdate(data)),
    ];

    this._context = context;
    parentQuestionId && context._byPqid.set(parentQuestionId, this);
    context._events.emit('create', this);
  }

  get questionId() {
    return this._questionId;
  }

  get previous() {
    const { parentQuestionId } = this;
    return parentQuestionId ? this._context.getByQuestionId(parentQuestionId) : undefined;
  }

  get next() {
    const { questionId } = this;
    return questionId ? this._context.getByParentQuestionId(questionId) : undefined;
  }

  followUp() {
    const { questionId } = this;
    return questionId ? this._context.getByParentQuestionId(questionId, { autoCreate: true }) : undefined;
  }

  // lifecycle //
  query({ q: question, ...payload } = {}) {
    payload = { ...payload, question };
    if (this.parentQuestionId) {
      payload.parent_question_id = this.parentQuestionId;
    }

    // may need to cascade delete follow up workflows
    this._deleteFollowUpIfNecessary();

    // clear question id from previous session
    if (this._questionId) {
      this._context._byQid.delete(this._questionId);
      this._questionId = undefined;
    }

    this._sessions.new();
    this._sessions.start();

    this._hub.update(fields.input(), mergeApiParams(this._apiParams, { payload }));

    return this;
  }

  _onDataUpdate(data) {
    if (this._questionId) {
      return;
    }
    const questionId = data && data.value && data.value.question_id;
    // capture question ID and register at context
    if (questionId) {
      this._questionId = questionId;
      this._context._byQid.set(questionId, this);
    }
  }

  _onAnswerViewUpdate({ session, status, ongoing }) {
    if (status === STATUS.INITIAL) {
      return;
    }
    const eventName = status === STATUS.READY && !ongoing ? 'done' : status;
    this._events.emit(eventName, { session });
  }

  _deleteFollowUpIfNecessary() {
    if (!this._context._cascadeDeleteFollowUps || !this.next) {
      return;
    }
    for (const element of this.next._views._containers.keys()) {
      element.remove();
    }
    this.next.destroy();
  }

  _destroy() {
    // TODO: abort ongoing request

    // cascade first
    this._deleteFollowUpIfNecessary();

    const { parentQuestionId, questionId } = this;
    if (parentQuestionId) {
      this._context._byPqid.delete(parentQuestionId);
    }
    if (questionId) {
      this._context._byQid.delete(questionId);
    }

    this._feedback._destroy();
    super._destroy();
  }

}
