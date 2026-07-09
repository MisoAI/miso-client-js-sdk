import { defineValues, trimObj, mergeInteractions } from '@miso.ai/commons';
import AnswerBasedWorkflow from './answer-based.js';
import { fields } from '../actor/index.js';
import { ROLE, STATUS, QUESTION_SOURCE } from '../constants.js';
import { mergeRolesOptions } from './options/index.js';
import { writeQuestionSourceToPayload, mappingSuggestionsData, mappingFollowUpQuestionsData } from './processors.js';
import { makeAutocompletable } from './autocompletable.js';

const ROLES_OPTIONS = mergeRolesOptions(AnswerBasedWorkflow.ROLES_OPTIONS, {
  members: [ROLE.REASONING, ROLE.RELATED_RESOURCES, ROLE.QUERY_SUGGESTIONS, ROLE.FOLLOW_UP_QUESTIONS],
  mappings: {
    [ROLE.QUERY_SUGGESTIONS]: mappingSuggestionsData,
    [ROLE.FOLLOW_UP_QUESTIONS]: mappingFollowUpQuestionsData,
  },
});

export default class Ask extends AnswerBasedWorkflow {

  constructor(context, parentQuestionId) {
    super({
      name: 'ask',
      context,
      roles: ROLES_OPTIONS,
      parentQuestionId,
    });
  }

  _initProperties(args) {
    super._initProperties(args);
    this._initAutocomplete(args);
    const { parentQuestionId } = args;
    defineValues(this, { parentQuestionId });
  }

  _initSubscriptions(args) {
    super._initSubscriptions(args);
    this._unsubscribes = [
      ...this._unsubscribes,
      this._hub.on(fields.view(ROLE.REASONING), state => this._onReasoningViewUpdate(state)),
      this._views.on(ROLE.ANSWER, 'follow-up-click', event => this._onFollowUpClick(event)),
      this._views.on(ROLE.FOLLOW_UP_QUESTIONS, 'select', event => this._onFollowUpQuestionSelect(event)),
      this._views.on(ROLE.QUERY_SUGGESTIONS, 'select', event => this._onQuerySuggestionSelect(event)),
    ];
  }

  _initSession(args) {
    // register at context
    args.parentQuestionId && this._context._byPqid.set(args.parentQuestionId, this);
    this._context._events.emit('create', this);
    super._initSession(args);
  }

  // lifecycle //
  restart() {
    const { next } = this;
    next && next.destroy();
    if (this._questionId) {
      this._context._byQid.delete(this._questionId);
    }
    super.restart();
  }

  // properties //
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

  // query //
  _buildPayload({ q, qs, questionId, ...options } = {}) {
    if (questionId) {
      return trimObj({
        ...options,
        question_id: questionId,
        // TODO: specify this is a replayed session
      });
    }
    const { parentQuestionId } = this;
    let payload = trimObj({
      ...options,
      question: q, // question, not q
      parent_question_id: parentQuestionId,
    });
    payload = writeQuestionSourceToPayload({ ...payload, qs });
    payload = this._writeWikiLinkTemplateToPayload(payload);
    return payload;
  }

  // data //
  _updateData(data) {
    super._updateData(data);
    this._triggerSuggestionsRefreshIfNecessary();
  }

  _triggerSuggestionsRefreshIfNecessary() {
    const { next } = this;
    if (!next) {
      return;
    }
    for (const view of next._views.getAll(ROLE.QUERY_SUGGESTIONS)) {
      view.refresh();
    }
  }

  // view //
  _onReasoningViewUpdate({ status, ongoing }) {
    if (status !== STATUS.READY || ongoing) {
      return;
    }
    for (const view of this._views.getAll(ROLE.REASONING)) {
      const element = view.element && view.element.closest('[data-role="reasoning-box"]');
      element && element.classList.add('done');
    }
  }

  // interactions //
  _defaultProcessInteraction(payload, args) {
    payload = super._defaultProcessInteraction(payload, args);
    payload = this._writeAdditionalAskPropertiesToInteraction(payload, args);
    return payload;
  }

  _writeAdditionalAskPropertiesToInteraction(payload, args) {
    const root_question_id = this.rootQuestionId;
    let { property } = (payload.context && payload.context.custom_context) || {};
    let question_id, parent_question_id, question_source;

    if (args.role === ROLE.FOLLOW_UP_QUESTIONS || args.role === ROLE.QUERY_SUGGESTIONS) {
      property = 'suggested_followup_questions';
    }

    if (args.role === ROLE.QUERY_SUGGESTIONS) {
      parent_question_id = this.previous && this.previous.parentQuestionId;
      question_id = this.parentQuestionId;
      question_source = this.previous && this.previous.session.meta.question_source;
    } else {
      parent_question_id = this.parentQuestionId;
    }

    return mergeInteractions(payload, {
      context: {
        custom_context: trimObj({ // question_id, question_source can be undefined
          property,
          root_question_id,
          parent_question_id,
          question_id,
          question_source,
        }),
      }
    });
  }

  // handlers //
  _onFollowUpClick({ q, event } = {}) {
    if (event.button !== 0) {
      return; // only left click
    }
    this._submitFollowUpQuestion({ q, qs: QUESTION_SOURCE.INLINE_QUESTION_LINK });
    // TODO: track click?
  }

  _onFollowUpQuestionSelect({ value: q }) {
    this._submitFollowUpQuestion({ q, qs: QUESTION_SOURCE.SUGGESTED_QUESTIONS });
  }

  _submitFollowUpQuestion({ q = '', qs } = {}) {
    q = q.trim();
    if (!q) {
      return;
    }
    const next = this.getOrCreateNext();
    next.query({ q, qs });
  }

  _onQuerySuggestionSelect({ value: q }) {
    if (!q) {
      return;
    }
    // backward compatible: query on current workflow
    this.query({ q, qs: QUESTION_SOURCE.SUGGESTED_QUESTIONS });
  }

  // helpers //
  _writeQuestionId(questionId) {
    // capture question ID and register at context
    if (!this._questionId && questionId) {
      this._questionId = questionId;
      this._context._byQid.set(questionId, this);
    }
  }

  _clearQuestionId() {
    // clear question id from previous session
    if (this._questionId) {
      this._context._byQid.delete(this._questionId);
      this._questionId = undefined;
    }
  }

  // destroy //
  _destroy(options) {
    const { next, parentQuestionId, questionId } = this;
    if (next) {
      next.destroy(options);
    }
    if (parentQuestionId) {
      this._context._byPqid.delete(parentQuestionId);
    }
    if (questionId) {
      this._context._byQid.delete(questionId);
    }
    super._destroy(options);
  }

}

makeAutocompletable(Ask.prototype);
