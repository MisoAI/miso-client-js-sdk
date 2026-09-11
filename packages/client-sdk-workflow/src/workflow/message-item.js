import { defineValues, trimObj } from '@miso.ai/commons';
import AnswerBasedWorkflow from './answer-based.js';
import { fields } from '../actor/index.js';
import { ROLE, STATUS } from '../constants.js';
import { mergeRolesOptions } from './options/index.js';
import { writeQuestionSourceToPayload } from './processors.js';

const ROLES_OPTIONS = mergeRolesOptions(AnswerBasedWorkflow.ROLES_OPTIONS, {
  mappings: {
    // the question layout takes the whole record: the question text plus
    // the authorship metadata
    [ROLE.QUESTION]: data => data.value,
  },
});

/**
 * One message (question-answer pair) of the conversation panel: the item
 * subworkflow behind a <miso-message-item> element, keyed by its question id and
 * managed by the MessageItems context (client.workflows.messageItems).
 *
 * An answer-based workflow that delivers its own data only when live: a
 * *live* message — one just posted in this session — posts its question and
 * streams the answer through its own data actor, exactly like the ask
 * workflow (post()); the conversation folds the stream back into its list.
 * A message that is *not* live has its data actor turned off (the `live`
 * flag at creation) and receives its record from the conversation workflow
 * through updateData() as data commits.
 *
 * Being a workflow of its own gives each message its own roles, layout
 * options, and trackers — so answer-content interactions (citation clicks,
 * answer link clicks, feedback) run through the standard answer-based
 * machinery and deduplicate at the message level.
 */
export default class MessageItem extends AnswerBasedWorkflow {

  // the parent question id is part of the message's identity, like the
  // question id: the lineage of a message never changes
  constructor(context, { questionId, placeholderId, threadPlaceholderId, parentQuestionId, superworkflow, live } = {}) {
    super({
      name: 'message-item',
      context,
      // the item shares the conversation workflow's options and defaults,
      // like the hybrid search's answer section: the message roles are
      // seeded under 'conversation', and configuring the conversation
      // (useApi for the question posting, useLayouts, ...) covers its items
      options: superworkflow._options,
      defaults: superworkflow._defaults,
      roles: ROLES_OPTIONS,
      // only a live message delivers its own data (posting the question,
      // ask-style); any other receives its record from the conversation
      // workflow, so the data actor has nothing to do
      extraOptions: { api: { active: !!live } },
      questionId,
      placeholderId,
      threadPlaceholderId,
      parentQuestionId,
      superworkflow,
    });
  }

  _initProperties(args) {
    super._initProperties(args);
    this._questionId = args.questionId;
    this._placeholderId = args.placeholderId;
    // the thread placeholder this message's root question creates, if any
    this._threadPlaceholderId = args.threadPlaceholderId;
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
    // adopting the id of a root question that created a thread IS the
    // thread's resolution — the question id is the thread id, by contract —
    // announced to the conversation workflow, if constructed (in the manner
    // of _onFollowUpClick). Being root is a matter of lineage, not of the
    // placeholder link: only a parentless question's id names the thread
    if (this._threadPlaceholderId && !this.parentQuestionId) {
      const conversation = this._client.workflows._conversation;
      conversation && conversation._resolveLiveMessage(this._threadPlaceholderId, questionId);
    }
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
  // tracker events forward to the superworkflow, stamped with this
  // workflow's data: the conversation translates them into interactions —
  // the answer info and the message's lineage read off the forwarded data
  _onTracker(args) {
    const workflow = this;
    const data = this._hub.states[fields.data()];
    this._superworkflow._onTracker({ ...args, data, workflow });
  }

  // handlers //
  // an inline follow-up link submits through the conversation workflow, if
  // constructed — a message has no query flow of its own
  _onFollowUpClick(event) {
    const conversation = this._client.workflows._conversation;
    conversation && conversation._onFollowUpClick(event);
  }

  // destroy //
  _destroy(options) {
    const { _questionId: questionId, _placeholderId: placeholderId } = this;
    questionId && this._context._byQid.delete(questionId);
    placeholderId && this._context._byPlaceholderId.delete(placeholderId);
    this._salvageThreadResolution();
    super._destroy(options);
  }

  // destroyed while its root question's post was still out: the thread is
  // created server-side all the same, so its id — arriving on the
  // expired-response salvage channel; the hub outlives the workflow — still
  // resolves the placeholder
  _salvageThreadResolution() {
    if (!this._threadPlaceholderId || this.parentQuestionId || this._questionId) {
      return; // no unresolved creation to salvage
    }
    const unsubscribe = this._hub.on(fields.expiredResponse(), ({ value }) => {
      const questionId = value && value.question_id;
      if (!questionId) {
        return;
      }
      unsubscribe();
      const conversation = this._client.workflows._conversation;
      conversation && conversation._resolveLiveMessage(this._threadPlaceholderId, questionId);
    });
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
// standard status mark, carried onto the <miso-message-item> element by the
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
