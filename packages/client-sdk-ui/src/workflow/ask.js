import { defineValues, trimObj, API } from '@miso.ai/commons';
import Workflow from './base.js';
import { fields, FeedbackActor, Trackers } from '../actor/index.js';
import { ROLE, STATUS } from '../constants.js';
import { SearchBoxLayout, OptionListLayout, ListLayout, TextLayout, TypewriterLayout, FeedbackLayout } from '../layout/index.js';
import { mergeApiParams } from './utils.js';

const DEFAULT_API_PARAMS = Object.freeze({
  group: API.GROUP.ASK,
  name: API.NAME.QUESTIONS,
  payload: {
    source_fl: ['cover_image', 'url', 'created_at', 'updated_at', 'published_at'],
    related_resource_fl: ['cover_image', 'url', 'created_at', 'updated_at', 'published_at'],
    cite_link: 1,
    cite_start: '[',
    cite_end: ']',
  },
});

const DEFAULT_LAYOUTS = Object.freeze({
  [ROLE.QUERY]: [SearchBoxLayout.type, { buttonText: 'Ask' }],
  [ROLE.QUESTION]: [TextLayout.type, { tag: 'h2' }],
  [ROLE.ANSWER]: TypewriterLayout.type,
  [ROLE.FEEDBACK]: FeedbackLayout.type,
  [ROLE.SOURCES]: [ListLayout.type, { incremental: true, itemType: 'article', templates: { ordered: true } }],
  [ROLE.RELATED_RESOURCES]: [ListLayout.type, { incremental: true, itemType: 'article' }],
  [ROLE.QUERY_SUGGESTIONS]: OptionListLayout.type,
});

const DEFAULT_TRACKERS = Object.freeze({
  [ROLE.SOURCES]: {},
  [ROLE.RELATED_RESOURCES]: {},
  [ROLE.QUERY_SUGGESTIONS]: {
    active: true, // we are tracking events at initial stage, when session is not active yet
    click: {
      validate: event => event.button === 0, // left click only
    },
  },
});

export default class Ask extends Workflow {

  constructor(context, parentQuestionId) {
    super(context._plugin, context._client, {
      name: 'ask',
      roles: Object.keys(DEFAULT_LAYOUTS),
      layouts: DEFAULT_LAYOUTS,
      defaultApiParams: DEFAULT_API_PARAMS,
    });
    this._trackers = new Trackers(this._hub, this._views, DEFAULT_TRACKERS);
    this._context = context;
    defineValues(this, { parentQuestionId });

    this._feedback = new FeedbackActor(this._hub);
    this._setSuggestedQuestions();

    this._unsubscribes = [
      ...this._unsubscribes,
      this._hub.on(fields.query(), payload => this.query(payload)),
      this._hub.on(fields.data(), data => this._onDataUpdate(data)),
      this._hub.on(fields.view(ROLE.ANSWER), data => this._onAnswerViewUpdate(data)),
      this._views.get(ROLE.ANSWER).on('citation-click', event => this._onCitationClick(event)),
    ];

    parentQuestionId && context._byPqid.set(parentQuestionId, this);
    context._events.emit('create', this);

    this.reset(); // create a session so query suggestions can be tracked
  }

  get questionId() {
    return this._questionId;
  }

  get rootQuestionId() {
    return this._context.root.questionId;
  }

  get previous() {
    const { parentQuestionId } = this;
    return parentQuestionId ? this._context.getByQuestionId(parentQuestionId) : undefined;
  }

  get next() {
    const { questionId } = this;
    return questionId ? this._context.getByParentQuestionId(questionId) : undefined;
  }

  getOrCreateNext() {
    const { questionId } = this;
    return questionId ? this._context.getByParentQuestionId(questionId, { autoCreate: true }) : undefined;
  }

  // lifecycle //
  query({ q: question, ...payload } = {}) {
    payload = { ...payload, question };
    if (this.parentQuestionId) {
      payload.parent_question_id = this.parentQuestionId;
    }

    // clear question id from previous session
    if (this._questionId) {
      this._context._byQid.delete(this._questionId);
      this._questionId = undefined;
    }

    this.restart();

    const { session } = this;
    this._hub.update(fields.request(), mergeApiParams(this._apiParams, { payload, session }));

    return this;
  }

  restart() {
    // TODO: move to workflow base
    const { session, status, ongoing } = this._hub.states[fields.view(ROLE.ANSWER)] || {};
    if (session && status !== STATUS.INITIAL && (status !== STATUS.READY || ongoing)) {
      // it's interrupted by a new question
      const state = Object.freeze({ session, status, ongoing });
      this._events.emit('interrupt', state);
      this._events.emit('finally', state);
    }
    super.restart();
  }

  _defaultProcessData(data) {
    data = super._defaultProcessData(data);
    const { value } = data;
    if (!value) {
      return data;
    }
    // 1. put answer_stage to meta
    // 2. mark ongoing flag
    return {
      ...data,
      ongoing: !value.finished,
      meta: {
        ...data.meta,
        answer_stage: value.answer_stage,
      },
    };
  }

  _onDataUpdate(data) {
    // TODO: can we just put this in _defaultProcessData?
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
    const done = status === STATUS.READY && !ongoing;
    const erroneous = status === STATUS.ERRONEOUS;
    const eventName = done ? 'done' : erroneous ? 'error' : status;
    const state = Object.freeze({ session, status, ongoing });
    this._events.emit(eventName, state);
    if (done || erroneous) {
      this._events.emit('finally', state);
    }
  }

  _setSuggestedQuestions() {
    const { previous } = this;
    if (!previous) {
      return;
    }
    const values = previous.states[fields.data()].value;
    const value = values.suggested_followup_questions || values.followup_questions || [];
    this._hub.update(fields.suggestions(), { value: value.map(text => ({ text })) });
  }

  _onCitationClick({ index }) {
    const { value } = this.states[fields.data()] || {};
    const { sources } = value || {};
    // index is 1-based
    const source = sources && sources[index - 1];
    if (!source || !source.product_id) {
      return;
    }
    // TODO: should we track impression as well?
    this._trackers.sources.click([source.product_id], { manual: false });
  }

  // trackers //
  get trackers() {
    return this._trackers;
  }

  useTrackers(options) {
    this._trackers.config(options);
    return this;
  }

  _preprocessInteraction(payload) {
    payload = super._preprocessInteraction(payload) || {};
    const { context = {} } = payload;
    const { custom_context = {} } = context;
    let { rootQuestionId, parentQuestionId, questionId } = this;
    // when we track suggested questions, we are actually tracking the suggested_followup_questions of the previous workflow
    if (custom_context.property === ROLE.QUERY_SUGGESTIONS) {
      questionId = parentQuestionId;
      parentQuestionId = this.previous && this.previous.parentQuestionId;
      custom_context.property = 'suggested_followup_questions';
    }
    payload.context = {
      ...context,
      custom_context: trimObj({
        root_question_id: rootQuestionId,
        parent_question_id: parentQuestionId,
        question_id: questionId,
        ...custom_context,
      }),
    };
    return payload;
  }

  _destroy() {
    const { parentQuestionId, questionId } = this;
    if (parentQuestionId) {
      this._context._byPqid.delete(parentQuestionId);
    }
    if (questionId) {
      this._context._byQid.delete(questionId);
    }

    this._trackers._destroy();
    this._feedback._destroy();
    super._destroy();
  }

}
