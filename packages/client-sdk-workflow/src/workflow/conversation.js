import { API, uuidv4 } from '@miso.ai/commons';
import Workflow from './base.js';
import { fields } from '../actor/index.js';
import { ROLE, REQUEST_TYPE, WORKFLOW_CONFIGURABLE } from '../constants.js';
import { mergeRolesOptions, mergeApiOptions, makeConfigurable } from './options/index.js';
import { writeQuestionSourceToPayload, writeThreadAsRead } from './processors.js';
import { isThreadUnread, settlePlaceholder, normalizeThreadValue, normalizeAnswersValue, getUnsettledQuestionIds, mergeAnswersDataFromResponse, mergeFollowUpDataFromResponse } from '../util/threads.js';

const ROLES_OPTIONS = mergeRolesOptions(Workflow.ROLES_OPTIONS, {
  main: ROLE.MESSAGES,
  members: [ROLE.MESSAGES, ROLE.QUERY, ROLE.TITLE, ROLE.RENAME, ROLE.SUBSCRIPTION],
  mappings: {
    // the header roles map (dot-path) into the open thread's record: the
    // title text, the rename dialog's pre-fill, the checkbox's checked state
    [ROLE.MESSAGES]: 'messages',
    [ROLE.TITLE]: 'thread.title',
    [ROLE.RENAME]: 'thread.title',
    [ROLE.SUBSCRIPTION]: 'thread.subscribed',
  },
});

/**
 * The conversation panel of the chat history interface, backed by the user
 * history API. Displays one thread at a time: load(threadId) starts a new
 * session (aborting an in-flight fetch) and fetches the thread detail.
 *
 * The data flow takes two requests per session, both going down the standard
 * data path — `_request()` → hub `request` → DataActor → source — in the
 * manner of search-based workflows' query/more requests, with the handling
 * split by `request.type` (REQUEST_TYPE) on the way in:
 *
 * 1. THREAD (head): `GET threads/{id}` retrieves the thread detail: the
 *    thread record — assumed to carry the same properties as the thread
 *    list API — and its turns, as question ids (or records without answer
 *    bodies).
 * 2. ANSWERS (follow-up): when the head data lands, a request to the answers
 *    API is issued with the pending `question_ids`, overriding the api
 *    group/name per request (from the resolved `answers` options, a
 *    configurable feature: defaults store < context < useAnswers()) since the
 *    two requests go to different API paths — both paths are resolved by the
 *    source (source.js). Its response is merged into the head data's messages
 *    rather than replacing it, and its loading update keeps the head data on
 *    display (`mergeAnswersDataFromResponse`, in the manner of
 *    `concatItemsFromMoreResponse`).
 *
 * A peer of the History workflow: the two are created independently and
 * coordinate by direct method calls only when both exist. Thread mutations
 * go through the shared ThreadsModel, whose facts both peers subscribe to
 * (_onThreadUpdated, ...). History loads its selection into this panel
 * (_onThreadSelect); Conversation marks loaded threads as read and announces
 * the placeholder lifecycle of a thread being created to the listed side
 * (_onConversationNew, _onConversationResolve).
 *
 * The panel's items live as workflows of their own: the messages layout is
 * a shell rendering one <miso-message> element per record, each hosting a
 * message item subworkflow (getMessageWorkflow) that this workflow feeds
 * through updateData() as data commits (_updateMessageWorkflows). All
 * answer-content rendering and interactions (citation clicks, link clicks,
 * feedback) happen on the message workflows; inline follow-up links submit
 * back through send() (_onFollowUpClick, delegated by the message workflow).
 */
export default class Conversation extends Workflow {

  constructor(plugin, client, model) {
    super({
      name: 'conversation',
      plugin,
      client,
      roles: ROLES_OPTIONS,
      model,
    });
  }

  _initProperties(args) {
    super._initProperties(args);
    this._model = args.model;
  }

  // the history (thread list) workflow, if constructed
  get _peer() {
    return this._client.workflows._history;
  }

  _initSubscriptions(args) {
    super._initSubscriptions(args);
    this._unsubscribes = [
      ...this._unsubscribes,
      this._hub.on(fields.query(), args => this._onQuery(args)),
      this._hub.on(fields.expiredResponse(), response => this._onExpiredResponse(response)),
      this._views.on(ROLE.RENAME, 'submit', event => this._onViewRenameSubmit(event)),
      this._views.on(ROLE.SUBSCRIPTION, 'change', event => this._onViewSubscriptionChange(event)),
      // thread facts from the shared model
      this._model.on('updated', event => this._onThreadUpdated(event)),
      this._model.on('deleted', event => this._onThreadDeleted(event)),
      this._model.on('all-deleted', () => this._onAllThreadsDeleted()),
    ];
  }

  restart() {
    super.restart();
    // presenting a placeholder thread is a direct side effect of a new
    // session: every fresh session starts in new-thread mode, not an empty
    // panel (a load() takes it to loading right away)
    this._loadPlaceholder();
    return this;
  }

  // properties //
  /**
   * The id of the thread on display, or being loaded. The identity lives in
   * the data layer: the committed thread record, or — while the head request
   * is in flight and no value is committed yet — the request itself.
   */
  get threadId() {
    const { thread } = this;
    const id = thread && thread.thread_id;
    if (id) {
      return id;
    }
    const request = this._hub.states[fields.request()];
    return (request && request.session === this.session && request.threadId) || undefined;
  }

  get thread() {
    const data = this._hub.states[fields.data()];
    return data && data.value && data.value.thread;
  }

  get messages() {
    const data = this._hub.states[fields.data()];
    return (data && data.value && data.value.messages) || [];
  }

  // lifecycle //
  /**
   * Load a thread into the conversation panel. Loading the current thread
   * again is a no-op unless `force` is set. The head response carries the
   * full thread record (the same properties as the thread list API), so the
   * thread id is all a load needs.
   */
  load(threadId, { force = false } = {}) {
    if (!threadId) {
      throw new Error(`threadId is required in load() call`);
    }
    if (threadId === this.threadId && !force) {
      return this;
    }
    this.restart();
    // mark as read as soon as it's loading: the user may just want to clear
    // the red dot
    this._markAsReadIfNecessary(threadId);
    // the request carries the thread identity, so the data layer holds all
    // the state of the load
    this._request({
      name: `${API.NAME.THREADS}/${threadId}`,
      type: REQUEST_TYPE.THREAD,
      threadId,
    });
    return this;
  }

  /**
   * Send a question: a follow-up to the current thread, or, in new-thread
   * mode (no thread loaded), the first question of a new thread. Either way,
   * the question bubble is appended optimistically (`live` marks the pair as
   * being generated in this session; the UI typewrites live answers) and
   * posted through the query api, with the last message as its parent —
   * a new thread's first question simply has none, making it a root question.
   *
   * A new thread additionally starts from a placeholder record announced to
   * the history workflow (which lists and selects it), settled once the
   * response arrives (see _resolveIfNecessary). The thread has no identity
   * yet — the placeholder record is keyed by a local `placeholder_id`
   * instead of a thread id, so nothing addresses it as a thread server-side.
   * The posting request carries the placeholder record, so the created
   * thread can be scavenged out of the response even if the user leaves the
   * panel before it arrives.
   */
  send(question) {
    if (!question) {
      throw new Error(`question is required in send() call`);
    }
    const data = this._hub.states[fields.data()];
    if (!data || !data.value) {
      return this;
    }
    // starting a new thread, unless one is loaded or already being created
    const placeholder = (this.threadId || (this.thread && this.thread.placeholder_id)) ? undefined : this._startPlaceholderThread(question);
    const messages = data.value.messages || [];
    const last = messages[messages.length - 1];
    const parent_question_id = last && last.question_id;
    this.updateData({
      ...data,
      value: {
        ...data.value,
        ...(placeholder ? { thread: placeholder } : {}),
        // the local placeholder id keys the message (its item binding and
        // its workflow) until the response brings the question id
        messages: [...messages, { placeholder_id: uuidv4(), question, live: true }],
      },
    });
    const { api } = this._options.resolved.query;
    this._request(mergeApiOptions(api, {
      // like the ask workflow, the payload carries the question source; in
      // this panel every question is typed, so it is always organic
      payload: writeQuestionSourceToPayload({ question, ...(parent_question_id ? { parent_question_id } : {}) }),
      type: REQUEST_TYPE.QUERY,
      ...(placeholder ? { placeholder } : {}),
    }));
    return this;
  }

  // thread operations //
  /**
   * Thread-level operations on the thread on display, on the shared
   * ThreadsModel — the facts come back through the model subscriptions, to
   * both panels. They require a loaded thread: a thread being created (or
   * none at all) has no server identity to operate on.
   */
  rename(title) {
    this._model.rename(this._requireThreadId('rename'), title);
  }

  subscribe() {
    this._model.subscribe(this._requireThreadId('subscribe'));
  }

  unsubscribe() {
    this._model.unsubscribe(this._requireThreadId('unsubscribe'));
  }

  delete() {
    this._model.delete(this._requireThreadId('delete'));
  }

  _requireThreadId(method) {
    const threadId = this.threadId;
    if (!threadId) {
      throw new Error(`No thread is on display for ${method}() call`);
    }
    return threadId;
  }

  // the local record standing in for a thread being created, announced to
  // the history workflow (which lists and selects it), if constructed
  _startPlaceholderThread(question) {
    // TODO: client side time is not reliable, don't use it for comparison with server time
    const thread = Object.freeze({ placeholder_id: uuidv4(), title: question, placeholder: true, updated_at: new Date().toISOString() });
    const peer = this._peer;
    peer && peer._onConversationNew(thread);
    return thread;
  }

  /**
   * Enter new-thread mode: a fresh session presenting a placeholder thread
   * with no messages, ready to take the first question. A no-op when the
   * panel is already sitting on an untouched new thread — nothing has been
   * asked, so there is nothing to reset — unless `force` is set.
   */
  new({ force = false } = {}) {
    if (!this.threadId && !(this.thread && this.thread.placeholder_id) && !force) {
      return this;
    }
    this.restart();
    return this;
  }

  _loadPlaceholder() {
    const { session } = this;
    this.updateData({ session, value: { thread: { placeholder: true }, messages: [] } });
  }

  // called by the history workflow //
  _onThreadSelect(threadId) {
    if (threadId === (this.thread && this.thread.placeholder_id)) {
      return; // the thread being created is on display already
    }
    this.load(threadId);
  }

  _onThreadUpdated({ threadId, changes }) {
    if (threadId !== this.threadId) {
      return;
    }
    const data = this._hub.states[fields.data()];
    if (!data || !data.value || !data.value.thread) {
      return;
    }
    const thread = { ...data.value.thread, ...changes };
    this.updateData({ ...data, value: { ...data.value, thread } });
  }

  _onThreadDeleted({ threadIds }) {
    const threadId = this.threadId;
    if (threadId && threadIds && threadIds.includes(threadId)) {
      this.new();
    }
  }

  _onAllThreadsDeleted() {
    if (this.threadId) {
      this.new();
    }
  }

  // view actions //
  _onQuery({ q }) {
    q && this.send(q);
  }

  _onViewRenameSubmit({ value }) {
    if (!value || !this.threadId) {
      return; // a thread being created has no server identity to rename yet
    }
    this.rename(value);
  }

  _onViewSubscriptionChange({ checked }) {
    if (!this.threadId) {
      return; // a thread being created has no subscription to toggle yet
    }
    checked ? this.subscribe() : this.unsubscribe();
  }

  // an inline follow-up link inside a message answer, delegated here by the
  // message workflow — answer-content interactions themselves live on the
  // message item subworkflows
  _onFollowUpClick({ q, event } = {}) {
    if (event.button !== 0) {
      return; // only left click
    }
    const { ongoing } = this._hub.states[fields.view(ROLE.MESSAGES)] || {};
    if (ongoing) {
      return; // an answer is still being displayed; hold, as the search box does
    }
    q = q ? q.trim() : '';
    q && this.send(q);
  }

  // request //
  _writeRequestTimeToSession(timestamp, options = {}) {
    // only the head request marks the session request time
    if (options.type !== REQUEST_TYPE.THREAD) {
      return;
    }
    super._writeRequestTimeToSession(timestamp, options);
  }

  // data //
  /**
   * Homogenize the value to the canonical { thread, messages } shape, by
   * request type — but merge nothing: merging into the current data happens
   * later, in _updateDataInHub, past the custom data processors, so each
   * piece of data runs through them exactly once, in the one shape.
   */
  _defaultProcessData(data, oldData) {
    data = super._defaultProcessData(data, oldData);
    if (!data.value) {
      return data;
    }
    switch (data.request && data.request.type) {
      case REQUEST_TYPE.ANSWERS:
        // TODO: we will pull partial data later
        return { ...data, value: { messages: normalizeAnswersValue(data.value) } };
      case REQUEST_TYPE.QUERY:
        // the response body is the (last) message of the conversation
        return { ...data, value: { messages: [data.value] } };
      case REQUEST_TYPE.THREAD:
        return { ...data, value: writeThreadAsRead(normalizeThreadValue(data.value)) };
      default:
        return data;
    }
  }

  _updateDataInHub(data, oldData) {
    // captured before the merges: they restore the head request on the
    // merged data, and swap the current data in for a valueless update
    const type = data.request && data.request.type;
    const hasResponse = !!data.value;
    switch (type) {
      case REQUEST_TYPE.ANSWERS:
        data = this._mergeDataFromAnswersRequest(data, oldData);
        break;
      case REQUEST_TYPE.QUERY:
        data = this._mergeDataFromQueryRequest(data, oldData);
        break;
    }
    super._updateDataInHub(data, oldData);
    // propagate the committed records into the message item subworkflows
    this._updateMessageWorkflows();
    // follow-up actions, each tied to the one point of the flow it matters:
    // dispatched by the request type that produced the data (the merges
    // restore the head request on the merged data, so the original type
    // drives the dispatch)
    switch (type) {
      case REQUEST_TYPE.THREAD:
        // the head data tells which answer contents to fetch
        this._requestAnswersIfNecessary(data);
        break;
      case REQUEST_TYPE.ANSWERS:
        // unfinished answers keep the polling going
        this._requestAnswersIfNecessary(data);
        break;
      case REQUEST_TYPE.QUERY:
        // the posting response carries the question id that settles a
        // thread being created; the loading update carries nothing yet
        hasResponse && this._resolveIfNecessary(data);
        break;
    }
  }

  // messages as item subworkflows //
  /**
   * The message workflow of the given message: the item subworkflow behind
   * a <miso-message> element. Takes the message record — the messages
   * layout passes the item binding's value, which also covers a just-posted
   * message that has no question id yet (keyed by its local placeholder id,
   * adopting the question id when the response arrives) — or a question id,
   * for an explicitly bound element. Created on demand from the messages
   * context (client.workflows.messages) and seeded with the record on
   * display, if present; from then on, every data commit propagates the
   * record in through updateData().
   */
  getMessageWorkflow(message) {
    const context = this._client.workflows.messages;
    if (typeof message === 'string') {
      message = this.messages.find(m => m.question_id === message) || { question_id: message };
    }
    let workflow = context.get(message);
    if (!workflow) {
      workflow = context.get(message, { autoCreate: true });
      workflow && this.messages.includes(message) && this._updateMessageWorkflow(workflow, message);
    }
    return workflow;
  }

  // propagate the committed records — only ever into existing message
  // workflows: instances are created by elements (getMessageWorkflow), not
  // by data, so nothing is constructed when <miso-message> is not in play
  _updateMessageWorkflows() {
    const context = this._client.workflows._messages;
    if (!context) {
      return;
    }
    for (const message of this.messages) {
      const workflow = context.get(message);
      workflow && this._updateMessageWorkflow(workflow, message);
    }
  }

  _updateMessageWorkflow(workflow, message) {
    if (workflow.message === message) {
      return; // the very record on display already, nothing to propagate
    }
    workflow.updateData({ session: workflow.session, value: message });
  }

  _mergeDataFromQueryRequest(data, oldData) {
    return mergeFollowUpDataFromResponse(oldData, data);
  }

  _mergeDataFromAnswersRequest(data, oldData) {
    if ((data.value || data.error) && data.session) {
      // the answers request settled; polling may reschedule if needed
      this._getSessionContext(data.session).answersPending = false;
    }
    return mergeAnswersDataFromResponse(oldData, data);
  }

  /**
   * Opening a thread marks it as read, right at load time. The unread state
   * is read off the peer's listed record; with no history workflow around,
   * no unread state is tracked and nothing is marked.
   */
  _markAsReadIfNecessary(threadId) {
    /*
    const history = this._peer;
    if (!history || !isThreadUnread(history.get(threadId))) {
      // TODO: check spec: do we always want to mark as read?
      return;
    }
    */
    this._model.markAsRead(threadId);
  }

  /**
   * Settle a started new thread when the first question response arrives: by
   * contract the thread id *is* the id of the thread's first question, so the
   * id needs no lookup — only the thread record itself is fetched.
   */
  _resolveIfNecessary(data) {
    const { thread, messages } = data.value || {};
    const placeholderId = thread && thread.placeholder_id;
    if (!placeholderId) {
      return; // not a new thread
    }
    const questionId = messages && messages[0] && messages[0].question_id;
    if (!questionId) {
      throw new Error(`questionId is required for thread resolving`);
    }
    // notify the history workflow, if constructed, to settle the thread ID
    const peer = this._peer;
    peer && peer._onConversationResolve(placeholderId, questionId);
    // settle the panel's own record likewise: with the placeholder gone the
    // resolution cannot fire twice, and the thread is addressable right away
    this.updateData({ ...data, value: { ...data.value, thread: settlePlaceholder(thread, questionId) } });
  }

  /**
   * Scavenge the created thread out of a response arriving after its session
   * expired: when the user leaves the panel mid-creation, the posting
   * request keeps carrying its placeholder record, and the response still
   * tells the question id — the thread id, by contract. The session has
   * moved on, so the panel is left alone: the resolution is only announced,
   * and the history list settles its placeholder item into a real,
   * selectable record all the same.
   */
  _onExpiredResponse({ session, request, value }) {
    if (!request || request.type !== REQUEST_TYPE.QUERY) {
      return; // only a posting request may carry a thread creation
    }
    const placeholder = request.placeholder;
    const questionId = value && value.question_id;
    if (!placeholder || !questionId) {
      return; // not a thread-creating request, or no response to salvage
    }
    // notify the history workflow, if constructed, to settle the thread ID;
    // if the resolution had already run in-session before the switch, the
    // settled list item makes this announcement a no-op
    const peer = this._peer;
    peer && peer._onConversationResolve(placeholder.placeholder_id, questionId);
  }

  /**
   * Fetch or poll answer contents, driven by the answer state: any (non-live)
   * message whose answer is absent or unfinished keeps the answers request
   * going — an unfinished answer is re-polled regardless of how the panel got
   * here (posted in this session, or reloaded mid-generation).
   */
  _requestAnswersIfNecessary(data) {
    const questionIds = getUnsettledQuestionIds(data.value);
    if (!questionIds.length) {
      return;
    }
    const { session } = data;
    const context = this._getSessionContext(session);
    if (context.answersPending) {
      return; // a request is in flight, or a poll is scheduled
    }
    context.answersPending = true;
    if (!context.answersRequested) {
      context.answersRequested = true;
      this._requestAnswers(questionIds);
      return;
    }
    // the answers came back unfinished; poll again after an interval
    const { pollingInterval = 1000 } = this._options.resolved.answers;
    setTimeout(() => {
      if (this.session === session) {
        this._requestAnswers(questionIds);
      }
    }, pollingInterval);
  }

  _requestAnswers(question_ids) {
    // TODO: use single answer endpoint when array length = 1
    const { api } = this._options.resolved.answers;
    this._request(mergeApiOptions(api, {
      payload: { question_ids },
      type: REQUEST_TYPE.ANSWERS,
    }));
  }

}

makeConfigurable(Conversation.prototype, [WORKFLOW_CONFIGURABLE.ANSWERS, WORKFLOW_CONFIGURABLE.QUERY]);
