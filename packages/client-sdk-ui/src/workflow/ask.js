import { defineValues, trimObj } from '@miso.ai/commons';
import { API } from '@miso.ai/client-sdk-core';
import Workflow from './base.js';
import { fields, FeedbackActor, Tracker } from '../actor/index.js';
import { ROLE, STATUS } from '../constants.js';
import { SearchBoxLayout, OptionListLayout, ListLayout, TextLayout, TypewriterLayout, FeedbackLayout } from '../layout/index.js';
import { mergeApiParams } from './utils.js';
import { utils as dataUtils } from '../source/index.js';

const DEFAULT_API_PARAMS = Object.freeze({
  group: API.GROUP.ASK,
  name: API.NAME.QUESTIONS,
  payload: {
    source_fl: ['cover_image', 'url'],
    related_resource_fl: ['cover_image', 'url'],
  },
});

const DEFAULT_LAYOUTS = Object.freeze({
  [ROLE.QUERY]: [SearchBoxLayout.type, { buttonText: 'Ask' }],
  [ROLE.QUESTION]: [TextLayout.type, { tag: 'h2' }],
  [ROLE.ANSWER]: TypewriterLayout.type,
  [ROLE.FEEDBACK]: FeedbackLayout.type,
  [ROLE.SOURCES]: [ListLayout.type, { incremental: true, }],
  [ROLE.RELATED_RESOURCES]: [ListLayout.type, { incremental: true, }],
  [ROLE.QUERY_SUGGESTIONS]: OptionListLayout.type,
});

function getDefaultLayouts(parentQuestionId) {
  return parentQuestionId ? {
    ...DEFAULT_LAYOUTS,
    [ROLE.QUERY]: [SearchBoxLayout.type, { buttonText: 'Ask' }],
  } : DEFAULT_LAYOUTS;
}

export default class Ask extends Workflow {

  constructor(context, parentQuestionId) {
    super(context._plugin, context._client, {
      name: 'ask',
      roles: Object.keys(DEFAULT_LAYOUTS),
      layouts: getDefaultLayouts(parentQuestionId),
      defaultApiParams: DEFAULT_API_PARAMS,
    });
    this._context = context;
    defineValues(this, { parentQuestionId });

    this._feedback = new FeedbackActor(this._hub);
    this._trackers = {
      sources: new Tracker(this._hub, this._views.get(ROLE.SOURCES)),
      relatedResources: new Tracker(this._hub, this._views.get(ROLE.RELATED_RESOURCES)),
    };
    this._setSuggestedQuestions();
    Object.freeze(this._trackers);

    this._unsubscribes = [
      ...this._unsubscribes,
      this._hub.on(fields.query(), payload => this.query(payload)),
      this._hub.on(fields.data(), data => this._onDataUpdate(data)),
      this._hub.on(fields.view(ROLE.ANSWER), data => this._onAnswerViewUpdate(data)),
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
    this._hub.update(fields.input(), mergeApiParams(this._apiParams, { payload, session }));

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

  _postProcessData({ value, ...data } = {}) {
    value = dataUtils.postProcessQuestionsResponse(value);
    const ongoing = value && !value.finished; // TODO: do we need this?
    return { value, ongoing, ...data };
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
    if (value.length > 0) {
      const view = this._views.get(ROLE.QUERY_SUGGESTIONS);
      const tracker = this._trackers.querySuggestions = new Tracker(this._hub, view, {
        items: view.layout.items,
        active: true, // we are tracking events at initial stage, when session is not active yet
      });
      tracker.config({
        click: {
          validate: event => event.button === 0, // left click only
        },
      });
    }
    this._hub.update(fields.suggestions(), { value: value.map(text => ({ text })) });
  }

  // trackers //
  get trackers() {
    return this._trackers;
  }

  useTrackers({ sources, relatedResources, suggestedFollowUpQuestions } = {}) {
    this._trackers.sources.config(sources);
    this._trackers.relatedResources.config(relatedResources);
    // TODO
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
      custom_context.items = payload.product_ids.map(({ text }) => text);
      payload.product_ids = [];
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

    this._feedback._destroy();
    this._trackers.sources._destroy();
    this._trackers.relatedResources._destroy();
    super._destroy();
  }

}
