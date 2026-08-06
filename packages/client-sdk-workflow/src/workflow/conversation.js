import { API, uuidv4 } from '@miso.ai/commons';
import Workflow from './base.js';
import { fields } from '../actor/index.js';
import { ROLE, REQUEST_TYPE, WORKFLOW_CONFIGURABLE } from '../constants.js';
import { mergeRolesOptions, mergeApiOptions, makeConfigurable } from './options/index.js';
import { getThreadId, getPlaceholderId, getQuestionId, isThreadUnread, settlePlaceholder, normalizeThreadValue, normalizeAnswersValue, getUnsettledQuestionIds, mergeAnswersDataFromResponse, mergeFollowUpDataFromResponse } from '../util/threads.js';

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
 * 1. THREAD (head): `GET threads/{id}` retrieves the thread detail, whose
 *    turns are question ids (or records without answer bodies).
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
 * A subworkflow of the history workflow (like hybrid-search/answer): created
 * and owned by History, exposed as `history.conversation`. The two coordinate
 * by direct method calls: History loads its selection into this panel
 * (_onThreadSelect) and applies thread facts to it (_onThreadUpdated,
 * _onThreadDeleted, ...); Conversation marks loaded threads as read (via
 * the superworkflow's markAsRead, once their answer contents arrive) and
 * announces the placeholder lifecycle of a thread being created
 * (_onConversationNew, _onConversationResolve).
 */
export default class Conversation extends Workflow {

  constructor(superworkflow) {
    super({
      name: 'conversation',
      plugin: superworkflow._plugin,
      client: superworkflow._client,
      roles: ROLES_OPTIONS,
      superworkflow,
    });
  }

  _initProperties(args) {
    super._initProperties(args);
    this._superworkflow = args.superworkflow;
  }

  _initSubscriptions(args) {
    super._initSubscriptions(args);
    this._unsubscribes = [
      ...this._unsubscribes,
      this._hub.on(fields.query(), args => this._onQuery(args)),
      this._hub.on(fields.expiredResponse(), response => this._onExpiredResponse(response)),
      this._views.on(ROLE.RENAME, 'submit', event => this._onViewRenameSubmit(event)),
      this._views.on(ROLE.SUBSCRIPTION, 'change', event => this._onViewSubscriptionChange(event)),
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
    const id = getThreadId(this.thread);
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
   * again is a no-op unless `force` is set. An optional `data` — the
   * thread's list record, passed along by the history selection — fills in
   * the thread metadata the head response may not carry.
   */
  load(threadId, { force = false, data } = {}) {
    if (!threadId) {
      throw new Error(`threadId is required in load() call`);
    }
    if (threadId === this.threadId && !force) {
      return this;
    }
    this.restart();
    // mark as read as soon as it's loading: the user may just want to clear
    // the red dot
    this._markAsReadIfNecessary(threadId, data);
    // the request carries the thread identity and the list record, so the
    // data layer holds all the state of the load
    this._request({
      name: `${API.NAME.THREADS}/${threadId}`,
      type: REQUEST_TYPE.THREAD,
      threadId,
      thread: data,
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
    const placeholder = (this.threadId || getPlaceholderId(this.thread)) ? undefined : this._startPlaceholderThread(question);
    const messages = data.value.messages || [];
    const last = messages[messages.length - 1];
    const parent_question_id = last && getQuestionId(last);
    this.updateData({
      ...data,
      value: {
        ...data.value,
        ...(placeholder ? { thread: placeholder } : {}),
        messages: [...messages, { question, live: true }],
      },
    });
    const { api } = this._options.resolved.query;
    this._request(mergeApiOptions(api, {
      payload: { question, ...(parent_question_id ? { parent_question_id } : {}) },
      type: REQUEST_TYPE.QUERY,
      ...(placeholder ? { placeholder } : {}),
    }));
    return this;
  }

  // thread operations //
  /**
   * Thread-level operations on the thread on display, delegated to the
   * history workflow, where the mutation calls the API and applies the fact
   * to both panels. They require a loaded thread: a thread being created
   * (or none at all) has no server identity to operate on.
   */
  rename(title) {
    return this._superworkflow.rename(this._requireThreadId('rename'), title);
  }

  subscribe() {
    return this._superworkflow.subscribe(this._requireThreadId('subscribe'));
  }

  unsubscribe() {
    return this._superworkflow.unsubscribe(this._requireThreadId('unsubscribe'));
  }

  delete() {
    return this._superworkflow.delete(this._requireThreadId('delete'));
  }

  _requireThreadId(method) {
    const threadId = this.threadId;
    if (!threadId) {
      throw new Error(`No thread is on display for ${method}() call`);
    }
    return threadId;
  }

  // the local record standing in for a thread being created, announced to
  // the history workflow (which lists and selects it)
  _startPlaceholderThread(question) {
    // TODO: client side time is not reliable, don't use it for comparison with server time
    const thread = Object.freeze({ placeholder_id: uuidv4(), title: question, placeholder: true, updated_at: new Date().toISOString() });
    this._superworkflow._onConversationNew(thread);
    return thread;
  }

  /**
   * Enter new-thread mode: a fresh session presenting a placeholder thread
   * with no messages, ready to take the first question. A no-op when the
   * panel is already sitting on an untouched new thread — nothing has been
   * asked, so there is nothing to reset — unless `force` is set.
   */
  new({ force = false } = {}) {
    if (!this.threadId && !getPlaceholderId(this.thread) && !force) {
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
  _onThreadSelect({ threadId, thread }) {
    if (getPlaceholderId(thread) || threadId === getPlaceholderId(this.thread)) {
      return; // a thread being created has nothing to load; it is on display
    }
    this.load(threadId, { data: thread });
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
        return { ...data, value: this._mergeThreadData(normalizeThreadValue(data.value), data.request) };
      default:
        return data;
    }
  }

  // the list record of the loaded thread (carried by the head request) fills
  // in the thread metadata (title, ...) the head response may not carry —
  // the v0 API returns question ids only. The thread on display carries no
  // unread flag whatever the record or the response says: load() marks it as
  // read, so an open thread is read by definition
  _mergeThreadData(value, { thread } = {}) {
    if (!value || !value.thread) {
      return value;
    }
    const record = thread && getThreadId(thread) === getThreadId(value.thread) ? thread : undefined;
    return { ...value, thread: { ...record, ...value.thread, has_new: false } };
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
   * is read off the list record passed along by the selection, falling back
   * to the listed record for recordless loads.
   */
  _markAsReadIfNecessary(threadId, thread) {
    if (!isThreadUnread(thread) && !isThreadUnread(this._superworkflow.get(threadId))) {
      // TODO: check spec: do we always want to mark as read?
      return;
    }
    this._superworkflow.markAsRead(threadId);
  }

  /**
   * Settle a started new thread when the first question response arrives: by
   * contract the thread id *is* the id of the thread's first question, so the
   * id needs no lookup — only the thread record itself is fetched.
   */
  _resolveIfNecessary(data) {
    const { thread, messages } = data.value || {};
    const placeholderId = getPlaceholderId(thread);
    if (!placeholderId) {
      return; // not a new thread
    }
    const questionId = getQuestionId(messages && messages[0]);
    if (!questionId) {
      throw new Error(`questionId is required for thread resolving`);
    }
    // notify history workflow to settle the thread ID
    this._superworkflow._onConversationResolve(placeholderId, questionId);
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
    const questionId = getQuestionId(value);
    if (!placeholder || !questionId) {
      return; // not a thread-creating request, or no response to salvage
    }
    // notify history workflow to settle the thread ID; if the resolution
    // had already run in-session before the switch, the settled list item
    // makes this announcement a no-op
    this._superworkflow._onConversationResolve(getPlaceholderId(placeholder), questionId);
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
