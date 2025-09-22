import { API, mergeInteractions } from '@miso.ai/commons';
import Workflow from './base.js';
import { fields, FeedbackActor } from '../actor/index.js';
import { ROLE, STATUS, QUESTION_SOURCE } from '../constants.js';
import { SearchBoxLayout, TextLayout, ListLayout, GalleryLayout, TypewriterLayout, FeedbackLayout, AffiliationLayout } from '../layout/index.js';
import { processData as processAffiliationData } from '../affiliation/index.js';
import { mergeRolesOptions, autoQuery as autoQueryFn, updateQueryParametersInUrl, DEFAULT_AUTO_QUERY_PARAM, DEFAULT_TRACKER_OPTIONS } from './options/index.js';
import { mappingAnswerData, mappingReasoningData, writeAnswerStageToMeta, writeAskPropertiesToInteraction, writeAnswerClickInfoToInteraction, writeEventTargetToInteraction } from './processors.js';
import { enableUseLink } from './use-link.js';
import { isTracked, markAsTracked } from '../util/trackers.js';

const DEFAULT_API_OPTIONS = Object.freeze({
  ...Workflow.DEFAULT_API_OPTIONS,
  group: API.GROUP.ASK,
  payload: {
    ...Workflow.DEFAULT_API_OPTIONS.payload,
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
  ...Workflow.DEFAULT_LAYOUTS,
  [ROLE.QUERY]: [SearchBoxLayout.type, { placeholder: 'Ask a question' }],
  [ROLE.QUESTION]: [TextLayout.type, { tag: 'h2' }],
  [ROLE.ANSWER]: TypewriterLayout.type,
  [ROLE.FEEDBACK]: FeedbackLayout.type,
  [ROLE.IMAGES]: [GalleryLayout.type, { incremental: true, itemType: 'image' }],
  [ROLE.SOURCES]: [ListLayout.type, { incremental: true, itemType: 'article', templates: { ordered: true } }],
  [ROLE.AFFILIATION]: [AffiliationLayout.type, { incremental: true, itemType: 'affiliation', link: { rel: 'noopener nofollow' } }],
});

const DEFAULT_TRACKERS = Object.freeze({
  ...Workflow.DEFAULT_TRACKERS,
  [ROLE.ANSWER]: {
    active: true,
    itemless: true,
    deduplicated: false,
    click: DEFAULT_TRACKER_OPTIONS.click, // click only
  },
  [ROLE.IMAGES]: DEFAULT_TRACKER_OPTIONS,
  [ROLE.SOURCES]: DEFAULT_TRACKER_OPTIONS,
  [ROLE.AFFILIATION]: DEFAULT_TRACKER_OPTIONS,
  [ROLE.PRODUCTS]: DEFAULT_TRACKER_OPTIONS,
});

const DEFAULT_OPTIONS = Object.freeze({
  ...Workflow.DEFAULT_OPTIONS,
  api: DEFAULT_API_OPTIONS,
  autocomplete: DEFAULT_AUTOCOMPLETE_OPTIONS,
  layouts: DEFAULT_LAYOUTS,
  trackers: DEFAULT_TRACKERS,
});

const ROLES_OPTIONS = mergeRolesOptions(Workflow.ROLES_OPTIONS, {
  main: ROLE.ANSWER,
  members: Object.keys(DEFAULT_LAYOUTS),
  mappings: {
    [ROLE.ANSWER]: mappingAnswerData,
    [ROLE.REASONING]: mappingReasoningData,
  },
});

export default class AnswerBasedWorkflow extends Workflow {

  // constructor //
  _initProperties(args) {
    super._initProperties(args);
    this._questionId = undefined;
    this._autoQuery = false;
  }

  _initActors(args) {
    super._initActors(args);
    this._feedback = new FeedbackActor(this._hub);
  }

  _initSubscriptions(args) {
    super._initSubscriptions(args);
    this._unsubscribes = [
      ...this._unsubscribes,
      this._hub.on(fields.query(), args => this._query(args)),
      this._views.get(ROLE.ANSWER).on('citation-click', event => this._onCitationClick(event)),
      this._views.get(ROLE.ANSWER).on('link-click', event => this._onAnswerLinkClick(event)),
    ];
  }

  // lifecycle //
  restart() {
    // clear question id from previous session
    if (this._questionId) {
      this._questionId = undefined;
    }
    // restart
    super.restart();
  }

  _shallEmitLifecycleEvent(name, event) {
    return name === 'answer-stage' || super._shallEmitLifecycleEvent(name, event);
  }

  _emitInterruptEventIfNecessary() {
    const state = this._hub.states[fields.view(this._roles.main)] || {};
    if (state.session && state.status !== STATUS.INITIAL && (state.status !== STATUS.READY || state.ongoing)) {
      // it's interrupted by a new question
      this._emitLifecycleEvent('interrupt', state);
      this._emitLifecycleEvent('finally', state);
    }
  }

  _onMainViewUpdate(state) {
    const { status, session } = state;
    const done = status === STATUS.READY && !state.ongoing;
    const erroneous = status === STATUS.ERRONEOUS;
    const eventName = done ? 'done' : erroneous ? 'error' : status;
    // answer-stage
    const context = this._getSessionContext(session);
    const oldAnswerStage = context.answerStage;
    const newAnswerStage = state.meta && state.meta.answer_stage;
    if (newAnswerStage && newAnswerStage !== oldAnswerStage) {
      this._emitLifecycleEvent('answer-stage', Object.freeze({ ...state, answer_stage: newAnswerStage }));
      context.answerStage = newAnswerStage;
    }
    // ready, done, or error
    this._emitLifecycleEvent(eventName, state);
    if (done || erroneous) {
      // finally
      this._emitLifecycleEvent('finally', state);
    }
  }

  // properties //
  get questionId() {
    return this._questionId;
  }

  // query //
  autoQuery(options = {}) {
    autoQueryFn.call(this, options);
  }

  query(args) {
    // TODO: also accept "question", "questionSource"?
    if (!args.q && !args.questionId) {
      throw new Error(`q is required in query() call`);
    }
    this._hub.update(fields.query(), args);
  }

  _query(args = {}) {
    if (this._linkFn) {
      this._submitToPage(args);
      return;
    }
    // start a new session
    this.restart();

    // keep track of question source on this session, for suggested questions interactions
    this._writeQuestionSourceToSession(args);

    // build payload and trigger request
    const payload = this._buildPayload(args);
    this._request({ payload });
  }

  _writeQuestionSourceToSession(args) {
    this.session.meta.question_source = args.qs || QUESTION_SOURCE.ORGANIC; // might be null, not undefined
  }

  _buildPayload() {
    throw new Error(`Not implemented`);
  }

  _writeWikiLinkTemplateToPayload(payload) {
    if (!this._autoQuery || !this._autoQuery.param || this._autoQuery.param === DEFAULT_AUTO_QUERY_PARAM) {
      return payload;
    }
    return {
      ...payload,
      wiki_link_template: `?${this._autoQuery.param}=%s`,
    };
  }

  // data //
  _updateData(data) {
    // capture question ID and register at context
    this._writeQuestionIdFromData(data);

    // if it's the head response, write question id and return
    if (data.value && !data.value.answer_stage) {
      this._handleHeadResponse(data);
      return;
    }
    super._updateData(data);

    // update URL if autoQuery.updateUrl is not false
    updateQueryParametersInUrl.call(this, data);
  }

  _handleHeadResponse(data) {}

  _defaultProcessData(data, oldData) {
    data = super._defaultProcessData(data, oldData);
    data = processAffiliationData(data);
    data = writeAnswerStageToMeta(data);
    return data;
  }

  _writeQuestionIdFromData({ value }) {
    value && this._writeQuestionId(value.question_id);
  }

  // interactions //
  _defaultProcessInteraction(payload, args) {
    payload = super._defaultProcessInteraction(payload, args);
    payload = writeAskPropertiesToInteraction(payload, args);
    payload = writeAnswerClickInfoToInteraction(payload, args);
    payload = writeEventTargetToInteraction(payload, args);
    return payload;
  }

  _getQuestionSourceFromViewState(args) {
    const { request } = this._hub.states[fields.view(args.role)] || {};
    const { payload } = request || {};
    return (payload && payload.metadata && payload.metadata.question_source) || undefined;
  }

  // handlers //
  _onCitationClick({ index, event }) {
    if (event.button !== 0) {
      return; // only left click
    }
    if (isTracked(event)) {
      return;
    }
    const { value } = this._hub.states[fields.data()] || {};
    const { sources } = value || {};
    // index is 1-based
    const source = sources && sources[index - 1];
    if (!source || !source.product_id) {
      return;
    }
    // TODO: should we track impression as well?
    markAsTracked(event);
    // distinguish from regular sources element click
    this._views.trackers.sources.click([source.product_id], { event_target: 'citation-link' });
  }

  _onAnswerLinkClick({ event, ...item }) {
    if (event.button !== 0) {
      return; // only left click
    }
    if (isTracked(event)) {
      return;
    }
    markAsTracked(event);
    // put everything into args and let _defaultProcessInteraction() handles it
    // for it's hard to make it a standard item
    this._views.trackers.answer.click([], { items: [item] });
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

enableUseLink(AnswerBasedWorkflow.prototype);

Object.assign(AnswerBasedWorkflow, {
  DEFAULT_API_OPTIONS,
  DEFAULT_AUTOCOMPLETE_OPTIONS,
  DEFAULT_LAYOUTS,
  DEFAULT_TRACKERS,
  DEFAULT_OPTIONS,
  ROLES_OPTIONS,
});
