import { defineValues, trimObj, API } from '@miso.ai/commons';
import AnswerBasedWorkflow from './answer-based.js';
import { fields } from '../actor/index.js';
import { ROLE, ORGANIC_QUESTION_SOURCE } from '../constants.js';
import { OptionListLayout, ListLayout } from '../layout/index.js';

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
  [ROLE.RELATED_RESOURCES]: [ListLayout.type, { incremental: true, itemType: 'article' }],
  [ROLE.QUERY_SUGGESTIONS]: OptionListLayout.type,
});

const DEFAULT_TRACKERS = Object.freeze({
  ...AnswerBasedWorkflow.DEFAULT_TRACKERS,
  [ROLE.RELATED_RESOURCES]: {},
  [ROLE.QUERY_SUGGESTIONS]: {
    click: {
      validate: event => event.button === 0, // left click only
    },
  },
});

const DEFAULT_OPTIONS = Object.freeze({
  ...AnswerBasedWorkflow.DEFAULT_OPTIONS,
  api: DEFAULT_API_OPTIONS,
  layouts: DEFAULT_LAYOUTS,
  trackers: DEFAULT_TRACKERS,
});

export default class Ask extends AnswerBasedWorkflow {

  constructor(context, parentQuestionId) {
    super({
      name: 'ask',
      context,
      roles: Object.keys(DEFAULT_LAYOUTS),
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
    this._setSuggestedQuestions();
    super._initSubscriptions(args);
  }

  _setSuggestedQuestions() {
    const { previous } = this;
    if (!previous) {
      return;
    }
    // TODO: write question_source from payload._meta, so we don't need to write it to session.meta
    const values = previous.states[fields.data()].value;
    const value = values.suggested_followup_questions || values.followup_questions || [];
    this._hub.update(fields.suggestions(), { value: value.map(text => ({ text })) });
  }

  _initReset(args) {
    // register at context
    args.parentQuestionId && this._context._byPqid.set(args.parentQuestionId, this);
    this._context._events.emit('create', this);
    super._initReset(args);
  }

  // lifecycle //
  restart() {
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
  _buildPayload({ q, qs, ...payload } = {}) {
    const { parentQuestionId } = this;
    return trimObj({
      ...payload,
      question: q, // question, not q
      parent_question_id: parentQuestionId,
      _meta: {
        ...payload._meta,
        question_source: qs || ORGANIC_QUESTION_SOURCE, // might be null, not undefined
      },
    });
  }

  // interactions //
  _preprocessInteraction(payload) {
    payload = super._preprocessInteraction(payload) || {};

    const { context = {} } = payload;
    const { ...custom_context } = context.custom_context || {};
    let { rootQuestionId, parentQuestionId, questionId } = this;

    if (custom_context.property === ROLE.QUERY_SUGGESTIONS) {
      questionId = parentQuestionId;
      parentQuestionId = this.previous && this.previous.parentQuestionId;
      custom_context.property = 'suggested_followup_questions';
      custom_context.question_source = this.previous && this.previous.session.meta.question_source;
    }
    custom_context.question_id = questionId;
    custom_context.root_question_id = rootQuestionId;
    custom_context.parent_question_id = parentQuestionId;

    return {
      ...payload,
      context: {
        ...context,
        custom_context: trimObj(custom_context),
      },
    };
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
    const { parentQuestionId, questionId } = this;
    if (parentQuestionId) {
      this._context._byPqid.delete(parentQuestionId);
    }
    if (questionId) {
      this._context._byQid.delete(questionId);
    }
    super._destroy(options);
  }

}
