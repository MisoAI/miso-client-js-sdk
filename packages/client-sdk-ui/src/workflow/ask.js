import { defineValues, trimObj, API } from '@miso.ai/commons';
import Workflow from './base.js';
import { mergeApiOptions } from './options.js';
import * as sources from '../source/index.js';
import { fields, FeedbackActor, AutocompleteActor } from '../actor/index.js';
import { ROLE, STATUS, ORGANIC_QUESTION_SOURCE } from '../constants.js';
import { SearchBoxLayout, OptionListLayout, ListLayout, TextLayout, TypewriterLayout, FeedbackLayout, AffiliationLayout } from '../layout/index.js';
import { makeConfigurable } from './options.js';
import { processData as processAffiliationData } from '../affiliation/index.js';

const DEFAULT_API_OPTIONS = Object.freeze({
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

const DEFAULT_AUTOCOMPLETE_OPTIONS = Object.freeze({
  actor: false,
  api: {
    group: API.GROUP.ASK,
    name: API.NAME.AUTOCOMPLETE,
  },
});

const DEFAULT_LAYOUTS = Object.freeze({
  [ROLE.QUERY]: [SearchBoxLayout.type, { placeholder: 'Ask a question' }],
  [ROLE.QUESTION]: [TextLayout.type, { tag: 'h2' }],
  [ROLE.ANSWER]: TypewriterLayout.type,
  [ROLE.FEEDBACK]: FeedbackLayout.type,
  [ROLE.SOURCES]: [ListLayout.type, { incremental: true, itemType: 'article', templates: { ordered: true } }],
  [ROLE.RELATED_RESOURCES]: [ListLayout.type, { incremental: true, itemType: 'article' }],
  [ROLE.QUERY_SUGGESTIONS]: OptionListLayout.type,
  [ROLE.AFFILIATION]: [AffiliationLayout.type, { incremental: true, itemType: 'affiliation', link: { rel: 'noopener nofollow' } }],
});

const DEFAULT_TRACKERS = Object.freeze({
  [ROLE.SOURCES]: {},
  [ROLE.RELATED_RESOURCES]: {},
  [ROLE.AFFILIATION]: {
    viewable: false, // track viewable manually
  },
  [ROLE.QUERY_SUGGESTIONS]: {
    active: true, // we are tracking events at initial stage, when session is not active yet
    click: {
      validate: event => event.button === 0, // left click only
    },
  },
});

const DEFAULT_OPTIONS = Object.freeze({
  api: DEFAULT_API_OPTIONS,
  autocomplete: DEFAULT_AUTOCOMPLETE_OPTIONS,
  layouts: DEFAULT_LAYOUTS,
  trackers: DEFAULT_TRACKERS,
});

export default class Ask extends Workflow {

  constructor(context, parentQuestionId) {
    super({
      name: 'ask',
      context,
      roles: Object.keys(DEFAULT_LAYOUTS),
      defaults: DEFAULT_OPTIONS,
    });
    this._context = context;
    this._autoQuery = false;
    defineValues(this, { parentQuestionId });

    this._feedback = new FeedbackActor(this._hub);
    this._setSuggestedQuestions();

    /*
    this._autocomplete = new AutocompleteActor(this._hub, {
      source: sources.api(this._client),
      options: this._options,
    });
    */

    this._unsubscribes = [
      ...this._unsubscribes,
      this._hub.on(fields.query(), payload => this.query(payload)),
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
  autoQuery(options = {}) {
    const { setValue = true, focus = true } = this._autoQuery = options;
    const searchParams = new URLSearchParams(window.location.search);
    const q = searchParams.get('q');
    const qs = searchParams.get('qs');
    const { layout } = this._views.get(ROLE.QUERY);
    if (layout) {
      if (q && setValue) {
        layout.value = q;
      }
      if (!q && focus) {
        layout.focus();
      }
    }
    if (q) {
      this.query({ q, qs });
    }
  }

  query({ q: question, qs: questionSource, ...payload } = {}) {
    payload = { ...payload, question };
    questionSource = questionSource || ORGANIC_QUESTION_SOURCE;

    if (this.parentQuestionId) {
      payload.parent_question_id = this.parentQuestionId;
    }
    (payload._meta || (payload._meta = {})).question_source = questionSource;

    // clear question id from previous session
    if (this._questionId) {
      this._context._byQid.delete(this._questionId);
      this._questionId = undefined;
    }

    this.restart();

    const { session } = this;
    session.meta.question_source = questionSource;
    this._hub.update(fields.request(), mergeApiOptions(this._options.resolved.api, { payload, session }));

    return this;
  }

  restart() {
    // TODO: move to workflow base
    const { session, status, ongoing } = this._hub.states[fields.view(ROLE.ANSWER)] || {};
    if (session && status !== STATUS.INITIAL && (status !== STATUS.READY || ongoing)) {
      // it's interrupted by a new question
      const state = Object.freeze({ session, status, ongoing });
      this._emit('interrupt', state);
      this._emit('finally', state);
    }
    super.restart();
  }

  /*
  updateCompletions(event) {
    // TODO: verify
    this._hub.update(fields.completions(), {
      ...event,
      source: 'manual',
    });
    return this;
  }
  */

  _defaultProcessData(data) {
    data = super._defaultProcessData(data);
    const { value, request } = data;
    if (!value) {
      return data;
    }
    const { question_id: questionId, question } = value;
    const organic = request && request.payload && request.payload._meta && request.payload._meta.question_source === ORGANIC_QUESTION_SOURCE;

    // capture question ID and register at context
    if (!this._questionId && questionId) {
      this._questionId = questionId;
      this._context._byQid.set(questionId, this);
    }

    // update URL if autoQuery.updateUrl is not false
    if (this._autoQuery && this._autoQuery.updateUrl !== false) {
      const url = new URL(window.location);
      const currentQuestion = url.searchParams.get('q');
      // TODO: review this, handle &s=
      if (question !== currentQuestion && (!organic || this._autoQuery.updateUrl === true)) {
        url.searchParams.set('q', question);
        window.history.replaceState({}, '', url);
      }
    }

    // affiliation
    data = processAffiliationData(data);

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

  _onAnswerViewUpdate({ session, status, ongoing }) {
    if (status === STATUS.INITIAL) {
      return;
    }
    const done = status === STATUS.READY && !ongoing;
    const erroneous = status === STATUS.ERRONEOUS;
    const eventName = done ? 'done' : erroneous ? 'error' : status;
    const state = Object.freeze({ session, status, ongoing });
    this._emit(eventName, state);
    if (done || erroneous) {
      this._emit('finally', state);
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
      custom_context.question_source = this.previous && this.previous.session.meta.question_source;
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

  _destroy(options) {
    const { parentQuestionId, questionId } = this;
    if (parentQuestionId) {
      this._context._byPqid.delete(parentQuestionId);
    }
    if (questionId) {
      this._context._byQid.delete(questionId);
    }
    this._feedback._destroy();
    super._destroy(options);
  }

}
