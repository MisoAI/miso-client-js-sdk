import { trimObj, API } from '@miso.ai/commons';
import Workflow from './base.js';
import { mergeApiOptions } from './options.js';
import * as sources from '../source/index.js';
import { fields, FeedbackActor, AutocompleteActor } from '../actor/index.js';
import { ROLE, STATUS, ORGANIC_QUESTION_SOURCE } from '../constants.js';
import { SearchBoxLayout, ListLayout, TextLayout, TypewriterLayout, FeedbackLayout, AffiliationLayout } from '../layout/index.js';
import { processData as processAffiliationData } from '../affiliation/index.js';

const DEFAULT_API_OPTIONS = Object.freeze({
  group: API.GROUP.ASK,
  payload: {
    source_fl: ['cover_image', 'url', 'created_at', 'updated_at', 'published_at'],
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
  [ROLE.AFFILIATION]: [AffiliationLayout.type, { incremental: true, itemType: 'affiliation', link: { rel: 'noopener nofollow' } }],
});

const DEFAULT_TRACKERS = Object.freeze({
  [ROLE.SOURCES]: {},
  [ROLE.AFFILIATION]: {},
});

const DEFAULT_OPTIONS = Object.freeze({
  api: DEFAULT_API_OPTIONS,
  autocomplete: DEFAULT_AUTOCOMPLETE_OPTIONS,
  layouts: DEFAULT_LAYOUTS,
  trackers: DEFAULT_TRACKERS,
});

export default class AnswerBasedWorkflow extends Workflow {

  // constructor //
  _initProperties() {
    this._questionId = undefined;
    this._autoQuery = false;
  }

  _initActors() {
    this._feedback = new FeedbackActor(this._hub);
    /*
    this._autocomplete = new AutocompleteActor(this._hub, {
      source: sources.api(this._client),
      options: this._options,
    });
    */
  }

  _initSubscriptions() {
    this._unsubscribes = [
      ...this._unsubscribes,
      this._hub.on(fields.query(), payload => this.query(payload)),
      this._hub.on(fields.view(ROLE.ANSWER), data => this._onAnswerViewUpdate(data)),
      this._views.get(ROLE.ANSWER).on('citation-click', event => this._onCitationClick(event)),
    ];
  }

  // lifecycle //
  restart() {
    // clear question id from previous session
    if (this._questionId) {
      this._questionId = undefined;
    }
    // interrupt event
    // TODO: move to workflow base
    const { session, status, ongoing } = this._hub.states[fields.view(ROLE.ANSWER)] || {};
    if (session && status !== STATUS.INITIAL && (status !== STATUS.READY || ongoing)) {
      // it's interrupted by a new question
      const state = Object.freeze({ session, status, ongoing });
      this._emit('interrupt', state);
      this._emit('finally', state);
    }
    // restart
    super.restart();
  }

  // properties //
  get questionId() {
    return this._questionId;
  }

  // query //
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

  query(args = {}) {
    const { q: question, qs: questionSource } = args;
    if (!question) {
      throw new Error(`Question is required in query()`);
    }

    // start a new session
    this.restart();

    // keep track of question source on this session
    const { session } = this;
    session.meta.question_source = questionSource || ORGANIC_QUESTION_SOURCE; // might be null, not undefined

    // build payload and trigger request
    const payload = this._buildPayload(args);
    this._hub.update(fields.request(), mergeApiOptions(this._options.resolved.api, { payload, session }));

    return this;
  }

  _buildPayload({ q, qs, ...payload } = {}) {
    return {
      ...payload,
      question: q,
      _meta: {
        ...payload._meta,
        question_source: qs || ORGANIC_QUESTION_SOURCE, // might be null, not undefined
      },
    };
  }

  // autocomplete //
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

  // process data //
  _defaultProcessData(data) {
    data = super._defaultProcessData(data);

    // capture question ID and register at context
    this._writeQuestionIdFromData(data);

    // update URL if autoQuery.updateUrl is not false
    this._updateUrlIfNecessary(data);

    // affiliation
    data = processAffiliationData(data);

    return this._processDataAnswerStage(data);
  }

  _processDataAnswerStage(data) {
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

  _writeQuestionIdFromData({ value }) {
    if (!value) {
      return;
    }
    const { question_id: questionId } = value;
    this._writeQuestionId(questionId);
  }

  _updateUrlIfNecessary({ value, request }) {
    if (!value || !this._autoQuery || this._autoQuery.updateUrl === false) { // explicitly false
      return;
    }
    const { question } = value;
    const organic = request && request.payload && request.payload._meta && request.payload._meta.question_source === ORGANIC_QUESTION_SOURCE;

    const url = new URL(window.location);
    const currentQuestion = url.searchParams.get('q');
    // TODO: review this, handle &qs=
    if (question !== currentQuestion && (!organic || this._autoQuery.updateUrl === true)) {
      url.searchParams.set('q', question);
      window.history.replaceState({}, '', url);
    }
  }

  // interactions //
  _preprocessInteraction(payload) {
    payload = super._preprocessInteraction(payload) || {};
    const { context = {} } = payload;
    const { custom_context = {} } = context;
    let { questionId } = this;
    return {
      ...payload,
      context: {
        ...context,
        custom_context: trimObj({
          question_id: questionId,
          ...custom_context,
        }),
      },
    };
  }

  // handlers //
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

  // helpers //
  _writeQuestionId(questionId) {
    if (!this._questionId && questionId) {
      this._questionId = questionId;
    }
  }

  _clearQuestionId() {
    // clear question id from previous session
    this._questionId = undefined;
  }

  // destroy //
  _destroy(options) {
    this._feedback._destroy();
    // this._autocomplete._destroy();
    super._destroy(options);
  }

}

// makeConfigurable(AnswerBasedWorkflow.prototype, ['autocomplete']);

Object.assign(AnswerBasedWorkflow, {
  DEFAULT_API_OPTIONS,
  DEFAULT_AUTOCOMPLETE_OPTIONS,
  DEFAULT_LAYOUTS,
  DEFAULT_TRACKERS,
  DEFAULT_OPTIONS,
});