import { defineValues, trimObj, API } from '@miso.ai/commons';
import AnswerBasedWorkflow from './answer-based.js';
import { fields } from '../actor/index.js';
import { ROLE, STATUS, QUESTION_SOURCE } from '../constants.js';
import { OptionListLayout, ListLayout, SearchBoxLayout, TypewriterLayout } from '../layout/index.js';
import { mergeInteraction } from './processors.js';
import { mergeRolesOptions, DEFAULT_TRACKER_OPTIONS } from './options/index.js';
import { mappingSuggestionsData, mappingFollowUpQuestionsData } from './processors.js';
import { followUp as followUpTemplate } from '../defaults/ask/templates.js';

const DEFAULT_API_OPTIONS = Object.freeze({
  ...AnswerBasedWorkflow.DEFAULT_API_OPTIONS,
  name: API.NAME.QUESTIONS,
  payload: {
    ...AnswerBasedWorkflow.DEFAULT_API_OPTIONS.payload,
    related_resource_fl: ['cover_image', 'url', 'created_at', 'updated_at', 'published_at'],
  },
});

const DEFAULT_LAYOUTS = Object.freeze({
  ...AnswerBasedWorkflow.DEFAULT_LAYOUTS,
  [ROLE.QUERY]: [SearchBoxLayout.type, { templates: { buttonIcon: 'send' } }],
  [ROLE.REASONING]: TypewriterLayout.type,
  [ROLE.RELATED_RESOURCES]: [ListLayout.type, { incremental: true, itemType: 'article' }],
  [ROLE.QUERY_SUGGESTIONS]: OptionListLayout.type,
  [ROLE.FOLLOW_UP_QUESTIONS]: OptionListLayout.type,
});

const DEFAULT_TRACKERS = Object.freeze({
  ...AnswerBasedWorkflow.DEFAULT_TRACKERS,
  [ROLE.RELATED_RESOURCES]: DEFAULT_TRACKER_OPTIONS,
  [ROLE.QUERY_SUGGESTIONS]: {
    ...DEFAULT_TRACKER_OPTIONS,
    click: {
      ...DEFAULT_TRACKER_OPTIONS.click,
      validate: event => event.button === 0, // loosen criteria, for it's not a hyperlink
    },
  },
});

const DEFAULT_TEMPLATES = Object.freeze({
  followUp: followUpTemplate,
});

const DEFAULT_OPTIONS = Object.freeze({
  ...AnswerBasedWorkflow.DEFAULT_OPTIONS,
  api: DEFAULT_API_OPTIONS,
  layouts: DEFAULT_LAYOUTS,
  trackers: DEFAULT_TRACKERS,
  templates: DEFAULT_TEMPLATES,
});

const ROLES_OPTIONS = mergeRolesOptions(AnswerBasedWorkflow.ROLES_OPTIONS, {
  members: Object.keys(DEFAULT_LAYOUTS),
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
      defaults: DEFAULT_OPTIONS,
      parentQuestionId,
    });
  }

  _initProperties(args) {
    super._initProperties(args);
    const { parentQuestionId } = args;
    defineValues(this, { parentQuestionId });
  }

  _initSubscriptions(args) {
    super._initSubscriptions(args);
    this._unsubscribes = [
      ...this._unsubscribes,
      this._hub.on(fields.view(ROLE.REASONING), state => this._onReasoningViewUpdate(state)),
      this._views.get(ROLE.ANSWER).on('follow-up-click', event => this._onFollowUpClick(event)),
      this._views.get(ROLE.FOLLOW_UP_QUESTIONS).on('select', event => this._onFollowUpQuestionSelect(event)),
      this._views.get(ROLE.QUERY_SUGGESTIONS).on('select', event => this._onQuerySuggestionSelect(event)),
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
  _buildPayload({ q, qs, ...options } = {}) {
    const { parentQuestionId } = this;
    let payload = trimObj({
      ...options,
      question: q, // question, not q
      parent_question_id: parentQuestionId,
      _meta: {
        ...options._meta,
        question_source: qs || QUESTION_SOURCE.ORGANIC, // might be null, not undefined
      },
    });
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
    const view = next._views.get(ROLE.QUERY_SUGGESTIONS);
    view && view.refresh();
  }

  // view //
  _onReasoningViewUpdate({ status, ongoing }) {
    if (status !== STATUS.READY || ongoing) {
      return;
    }
    const element = this._getReasoningBoxElement();
    element && element.classList.add('done');
  }

  // interactions //
  _writeAskPropertiesToInteraction(payload, args) {
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
      question_id = this.questionId;
      question_source = this._getQuestionSourceFromViewState(args);
    }

    return mergeInteraction(payload, {
      context: {
        custom_context: {
          property,
          root_question_id,
          parent_question_id,
          question_id,
          question_source,
        },
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

  _getReasoningBoxElement() {
    const view = this._views.get(ROLE.REASONING);
    const element = view && view.element;
    return element && element.closest('[data-role="reasoning-box"]');
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
