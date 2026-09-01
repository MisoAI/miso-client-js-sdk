import { trimObj, mergeInteractions } from '@miso.ai/commons';
import AnswerBasedWorkflow from './answer-based.js';
import { fields } from '../actor/index.js';
import { ROLE, STATUS, QUESTION_SOURCE } from '../constants.js';
import { mergeRolesOptions } from './options/index.js';
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
 * An answer-based workflow with no data flow of its own: the data actor is
 * turned off (api.actor: false in the default options), and the conversation
 * workflow propagates the message record in through updateData() as its data
 * commits. Being a workflow of its own gives each message its own roles,
 * layout options, and trackers — so answer-content interactions (citation
 * clicks, answer link clicks, feedback) run through the standard
 * answer-based machinery and deduplicate at the message level.
 */
export default class Message extends AnswerBasedWorkflow {

  constructor(context, questionId) {
    super({
      name: 'message',
      context,
      roles: ROLES_OPTIONS,
      questionId,
    });
  }

  _initProperties(args) {
    super._initProperties(args);
    this._questionId = args.questionId;
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

  // data //
  // the record is pushed in whole by the conversation workflow; there is no
  // head/streamed-response distinction to dispatch on
  _shallHandleAsHeadResponse() {
    return false;
  }

  _defaultProcessData(data, oldData) {
    data = super._defaultProcessData(data, oldData);
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
