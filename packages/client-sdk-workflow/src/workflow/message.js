import { defineValues, trimObj, mergeInteractions } from '@miso.ai/commons';
import AnswerBasedWorkflow from './answer-based.js';
import { fields } from '../actor/index.js';
import { ROLE, STATUS, QUESTION_SOURCE } from '../constants.js';
import { mergeRolesOptions } from './options/index.js';
import { writeQuestionSourceToPayload } from './processors.js';
import { isUpdateMessage } from '../util/threads.js';

const ROLES_OPTIONS = mergeRolesOptions(AnswerBasedWorkflow.ROLES_OPTIONS, {
  mappings: {
    // the question layout takes the whole record: the question text plus
    // the authorship metadata
    [ROLE.QUESTION]: data => data.value,
  },
});

/**
 * One message (question-answer pair) of the conversation panel: the item
 * subworkflow behind a <miso-message> element, keyed by its question id and
 * managed by the Messages context (client.workflows.messages).
 *
 * An answer-based workflow that delivers its own data only when live: a
 * *live* message — one just posted in this session — posts its question and
 * streams the answer through its own data actor, exactly like the ask
 * workflow (post()); the conversation folds the stream back into its list.
 * A message that is *not* live has its data actor turned off (useApi(false),
 * applied by the Messages context at creation) and receives its record from
 * the conversation workflow through updateData() as data commits.
 *
 * Being a workflow of its own gives each message its own roles, layout
 * options, and trackers — so answer-content interactions (citation clicks,
 * answer link clicks, feedback) run through the standard answer-based
 * machinery and deduplicate at the message level.
 */
export default class Message extends AnswerBasedWorkflow {

  // the parent question id is part of the message's identity, like the
  // question id: the lineage of a message never changes
  constructor(context, { questionId, parentQuestionId } = {}) {
    super({
      name: 'message',
      context,
      roles: ROLES_OPTIONS,
      questionId,
      parentQuestionId,
    });
  }

  _initProperties(args) {
    super._initProperties(args);
    this._questionId = args.questionId;
    defineValues(this, { parentQuestionId: args.parentQuestionId });
  }

  _initSubscriptions(args) {
    super._initSubscriptions(args);
    this._unsubscribes = [
      ...this._unsubscribes,
      this._views.on(ROLE.ANSWER, 'follow-up-click', event => this._onFollowUpClick(event)),
    ];
  }

  // the question id is the workflow's identity — a restart never clears it
  _clearQuestionId() {}

  // a workflow created for a just-posted message has no question id yet: it
  // adopts the id when the record settles, registering at the context so
  // lookups by question id find it from then on
  _writeQuestionId(questionId) {
    if (this._questionId || !questionId) {
      return;
    }
    this._questionId = questionId;
    this._context._byQid.set(questionId, this);
  }

  // properties //
  get message() {
    const data = this._hub.states[fields.data()];
    return data && data.value;
  }

  // query //
  /**
   * Post a live message's question: an ask-style query through the data
   * actor, streaming the answer into this workflow's own data. The optimistic
   * record rides the request and is merged under every data commit
   * (writePostedMessageToData, like the keywords in the search-based
   * workflow) — the response values carry only the answer content, so the
   * record supplies the question and identity fields (question,
   * placeholder_id, live, ...) throughout the stream, and the question shows
   * from the request's loading commit on.
   */
  // TODO: bad name, use query()
  post(message) {
    this.query({ q: message.question, message });
  }

  // the session is started by query(), like in the base class
  _query({ message, ...args } = {}) {
    this._writeQuestionSourceToSession(args);
    const payload = this._buildPayload(args);
    this._request({ payload, message });
  }

  _buildPayload({ q, qs, ...options } = {}) {
    let payload = trimObj({
      ...options,
      question: q, // question, not q
      parent_question_id: this.parentQuestionId,
    });
    payload = writeQuestionSourceToPayload({ ...payload, qs });
    return payload;
  }

  // data //
  // a record is committed in whole — pushed by the conversation workflow, or
  // streamed by the posting; there is no head-response distinction to
  // dispatch on
  _shallHandleAsHeadResponse() {
    return false;
  }

  _defaultProcessData(data, oldData) {
    data = super._defaultProcessData(data, oldData);
    data = writePostedMessageToData(data);
    data = writeStatusFromAnswer(data);
    data = writeOngoingFromFinished(data);
    return data;
  }

  // interactions //
  _defaultProcessInteraction(payload, args) {
    payload = super._defaultProcessInteraction(payload, args);
    payload = this._writeMessageInfoToInteraction(payload, args);
    return payload;
  }

  /**
   * The message's question lineage: the record supplies its own parent
   * question id (the question chain may fork, so message order implies no
   * lineage) and its miso_id, when it carries one; the thread id — the id of
   * the thread's first question, by contract — is the root question id, read
   * off the conversation workflow, if constructed. The question source tells
   * an update message (written by the answer-updates monitor) from an
   * organic (typed) one.
   */
  _writeMessageInfoToInteraction(payload) {
    const message = this.message;
    if (!message) {
      return payload;
    }
    const conversation = this._client.workflows._conversation;
    return mergeInteractions(payload, trimObj({
      miso_id: message.miso_id,
      context: {
        custom_context: trimObj({
          root_question_id: conversation && conversation.threadId,
          parent_question_id: message.parent_question_id,
          question_source: isUpdateMessage(message) ? QUESTION_SOURCE.UPDATE : QUESTION_SOURCE.ORGANIC,
        }),
      },
    }));
  }

  // handlers //
  // an inline follow-up link submits through the conversation workflow, if
  // constructed — a message has no query flow of its own
  _onFollowUpClick(event) {
    const conversation = this._client.workflows._conversation;
    conversation && conversation._onFollowUpClick(event);
  }

}

// the posted record under the value, off the request it rides (like the
// keywords in the search-based workflow): the streamed responses carry the
// answer content only, so a value replacing the previous one wholesale would
// drop the question and identity fields (question, placeholder_id, live)
// between commits — runs after the base pass, which carries the request
// onto commits missing one
function writePostedMessageToData(data) {
  const { request, value } = data;
  const { message } = request || {};
  if (!message) {
    return data;
  }
  return { ...data, value: { ...message, ...value } };
}

// a record whose answer body has not arrived presents as loading — the
// standard status mark, carried onto the <miso-message> element by the
// container layout — while the conversation's answers request fetches the
// content
function writeStatusFromAnswer(data) {
  const { value } = data;
  if (!value || value.answer !== undefined) {
    return data;
  }
  return { ...data, status: STATUS.LOADING };
}

// an unfinished answer keeps the ongoing flag on, so views (e.g. a
// typewriter) treat the content as still streaming; message records may not
// carry the answer_stage field that normally drives this
function writeOngoingFromFinished(data) {
  const { value } = data;
  if (!value || value.finished !== false) {
    return data;
  }
  return { ...data, ongoing: true };
}
