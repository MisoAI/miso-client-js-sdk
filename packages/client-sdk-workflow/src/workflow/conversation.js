/** @module workflow */

import { trimObj, uuidv4, mergeInteractions, API } from '@miso.ai/commons';
import Workflow from './base.js';
import { fields } from '../actor/index.js';
import { getThreadRequest, ThreadOperations, mixinThreadOperationSupport } from './thread-operations.js';
import { ROLE, STATUS, REQUEST_TYPE, QUESTION_SOURCE, WORKFLOW_CONFIGURABLE } from '../constants.js';
import { mergeRolesOptions, makeConfigurable } from './options/index.js';
import { writeThreadAsRead, writeHasMoreExhaustionToData, writeAnswerInfoToInteraction } from './processors.js';
import { isThreadUnread, isUpdateMessage, settlePlaceholder, normalizeThreadValue, normalizeAnswersValue, getUnsettledQuestionIds, mergeAnswersDataFromResponse, mergeOlderMessagesFromResponse, writeAnswersErrorToMessages, getThreadChanges } from '../util/threads.js';

const ROLES_OPTIONS = mergeRolesOptions(Workflow.ROLES_OPTIONS, {
  main: ROLE.MESSAGES,
  members: [ROLE.MESSAGES, ROLE.QUERY, ROLE.TITLE, ROLE.RENAME, ROLE.DELETE, ROLE.SUBSCRIPTION, ROLE.FAVORITE],
  mappings: {
    // the header roles map (dot-path) into the open thread's record: the
    // title text and the checkbox's checked state. Rename, delete and
    // favorite take the whole record: their layouts derive the dialog text
    // from its title (the star its checked state from its favorite flag)
    // and the disabled state from its thread id's absence (a thread being
    // created is not addressable until resolved)
    [ROLE.MESSAGES]: 'messages',
    [ROLE.TITLE]: 'thread.title',
    [ROLE.RENAME]: 'thread',
    [ROLE.DELETE]: 'thread',
    [ROLE.SUBSCRIPTION]: 'thread.subscribed',
    [ROLE.FAVORITE]: 'thread',
  },
});

// the thread page requests (head and older pages) are idempotent reads, so
// transient failures (network, timeout, 5xx) are worth another try or two
// at the fetch layer — like the history list's; the answers polling brings
// its own tolerance instead (a failed poll is skipped, the stream ending
// only after consecutive failures pass the polling error limit)
const THREAD_REQUEST_OPTIONS = Object.freeze({ retry: 2 });

// the answers (follow-up) request's identity, spelled out at the call site
// like the head thread request's (getThreadRequest): the endpoint is fixed
// and takes no formatting payload — the per-poll payload is the question
// ids alone, so there is nothing for useApi() to customize — hence not an
// api option
const ANSWERS_REQUEST = Object.freeze({
  group: API.GROUP.ASK,
  name: API.NAME.ANSWERS,
  options: Object.freeze({ method: 'POST' }),
});

// The conversation panel of the chat history interface, backed by the user
// history API. Displays one thread at a time: load(threadId) starts a new
// session (aborting an in-flight fetch) and fetches the thread detail.
//
// The workflow carries no api option at all: both of its requests spell
// out their identity at the call site (the head thread request in load(),
// the answers request in _requestAnswersIfNecessary — a fixed endpoint
// with nothing for useApi() to customize), and the question posting
// belongs to the live message workflow. The data flow
// takes two requests per session, both going down the standard
// data path — `_request()` → hub `request` → data actor → source → hub
// `response` — in the manner of search-based workflows' query/more
// requests, with the handling split by `request.type` (REQUEST_TYPE) on
// the way in:
//
// 1. THREAD (head): `GET threads/{id}` retrieves the thread
//    detail: the thread record — assumed to carry the same properties as
//    the thread list API — and its turns, as question ids (or records
//    without answer bodies). The panel pages from the bottom, chat-style:
//    the head fetches the newest page only (order: desc, the pagination
//    options' `rows`), reversed into display order.
// 2. MORE (older page): the messages layout's infinite scroll trigger (at
//    the top of the list) fires the `more` hub field as the user scrolls
//    up, and _more() fetches the previous page (`after` = the oldest
//    displayed question id), prepended above the displayed messages
//    (`mergeOlderMessagesFromResponse`) — until a response says
//    `has_more: false`, the exhaustion.
// 3. ANSWERS (follow-up): when the head (or an older-page) data
//    lands with unsettled messages, a polling request is issued — the
//    answers api returns a polling iterable (question_ids given as a
//    function, resolved per poll; _requestAnswersIfNecessary) that the data
//    actor consumes like an ask answer stream. Its responses are merged
//    into the head data's messages rather than replacing it, and its
//    loading update keeps the head data on display
//    (`mergeAnswersDataFromResponse`, in the manner of
//    `concatItemsFromMoreResponse`). The content loads incrementally too:
//    each poll's batch is capped (the pagination options' `answersRows`),
//    newest unsettled first — the view is bottom-anchored, so those are
//    the messages on (or nearest) the screen.
//
// A peer of the History workflow: the two are created independently and
// coordinate by direct method calls only when both exist. Thread operations
// are fire-and-forget requests carrying their events, triggered off the
// request event as `thread` hub events — on both peers' hubs — which each
// panel handles off its own hub (_onThreadUpdated, ...). History loads its selection into this panel
// (_onThreadSelect); Conversation marks loaded threads as read and announces
// the placeholder lifecycle of a thread being created to the listed side
// (_onConversationNew, _onConversationResolve).
//
// The panel's items live as workflows of their own: the messages layout is
// a shell rendering one <miso-message-item> element per record, each hosting a
// message item subworkflow (_getMessageWorkflow) that this workflow feeds
// through updateData() as data commits (_updateMessageWorkflows). All
// answer-content rendering and interactions (citation clicks, link clicks,
// feedback) happen on the message workflows; inline follow-up links submit
// back through send() (_onFollowUpClick, delegated by the message workflow).

/**
 * The conversation panel of the chat history interface, available as
 * `client.workflows.conversation`. Shows one thread at a time, where the
 * user can read the messages and ask follow-up questions, or start a new
 * thread.
 *
 * Works with the history workflow (`client.workflows.history`): selecting a
 * thread in the list loads it here, and a new thread started here shows up
 * in the list. Each message is backed by a {@link module:workflow~MessageItem MessageItem} workflow,
 * which shares the options of this workflow.
 *
 * @extends module:workflow~Workflow
 * @mixes module:workflow~Configurable
 * @mixes module:workflow~PaginationConfigurable
 */
class Conversation extends Workflow {

  constructor(plugin, client, events) {
    super({
      name: 'conversation',
      plugin,
      client,
      roles: ROLES_OPTIONS,
      // the thread events channel shared with the history panel's data actor,
      // carrying the thread operation events across the two hubs
      extraOptions: { api: { threadEvents: events } },
    });
  }

  // the history (thread list) workflow, if constructed
  get _peer() {
    return this._client.workflows._history;
  }

  _initSubscriptions(args) {
    super._initSubscriptions(args);
    this._unsubscribes = [
      ...this._unsubscribes,
      this._views.on(ROLE.QUERY, 'submit', event => this._onQuerySubmit(event)),
      // the messages layout's infinite scroll trigger, at the top of the
      // list: older pages load as the user scrolls up
      this._hub.on(fields.more(), () => this._more()),
      this._views.on(ROLE.RENAME, 'submit', event => this._onViewRenameSubmit(event)),
      this._views.on(ROLE.DELETE, 'submit', () => this._onViewDeleteSubmit()),
      this._views.on(ROLE.SUBSCRIPTION, 'change', event => this._onViewSubscriptionChange(event)),
      this._views.on(ROLE.FAVORITE, 'change', event => this._onViewFavoriteChange(event)),
      // an operation's event rides its request: the
      // data actor publishes it on the shared channel and every subscribed
      // actor — this panel's and its peer's — triggers it on its own hub
      this._hub.on(fields.thread(), event => this._onThreadEvent(event)),
    ];
  }

  restart() {
    // leaving the session tears the displayed thread's message item
    // workflows down
    this._destroyMessageWorkflows();
    super.restart();
    // presenting a placeholder thread is a direct side effect of a new
    // session: every fresh session starts in new-thread mode, not an empty
    // panel (a load() takes it to loading right away)
    this._loadPlaceholder();
    return this;
  }

  // properties //
  /**
   * The ID of the thread on display, or being loaded. Absent for a new
   * thread not yet created.
   *
   * @type {string|undefined}
   */
  get threadId() {
    // the identity lives in the data layer: the committed thread record, or
    // — while the head request is in flight and no value is committed yet —
    // the request itself
    const { thread } = this;
    const id = thread && thread.thread_id;
    if (id) {
      return id;
    }
    const request = this._hub.states[fields.request()];
    return (request && request.session === this.session && request.threadId) || undefined;
  }

  /**
   * The thread record on display.
   *
   * @type {Object|undefined}
   */
  get thread() {
    const data = this._hub.states[fields.data()];
    return data && data.value && data.value.thread;
  }

  /**
   * The messages on display, oldest first.
   *
   * @type {Object[]}
   */
  get messages() {
    const data = this._hub.states[fields.data()];
    return (data && data.value && data.value.messages) || [];
  }

  /**
   * Whether no more older messages will be loaded, as the displayed messages
   * reach the start of the thread, or a page failed to load.
   *
   * @type {boolean}
   */
  get exhausted() {
    // the latest thread page said `has_more: false`, or a failed page parked
    // the paging. Wiped with the data on a reload (a new session)
    const data = this._hub.states[fields.data()];
    return !!(data && data.meta && data.meta.exhausted);
  }

  // lifecycle //
  /**
   * Load a thread into the conversation panel, and mark it as read.
   *
   * @param {string} threadId - The thread ID.
   * @param {Object} [options]
   * @param {boolean} [options.force=false] - Reload even if the thread is already on display.
   * @returns {this}
   */
  load(threadId, { force = false } = {}) {
    // the head response carries the full thread record (the same properties
    // as the thread list API), so the thread id is all a load needs
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
    // the state of the load. Its identity is spelled out here, like the
    // answers request's — the workflow has no api option — and the data
    // actor serves it through the data source like any other. The panel
    // pages from the bottom: the head fetches the newest page of question
    // ids only, older pages following through the more flow
    const { rows } = this._options.resolved.pagination || {};
    this._request({
      ...getThreadRequest(threadId, trimObj({ order: 'desc', rows })),
      type: REQUEST_TYPE.THREAD,
      threadId,
      options: THREAD_REQUEST_OPTIONS,
    });
    return this;
  }

  // Load the previous (older) page of the thread's messages, prepended
  // above the displayed ones — same session, down the standard data path.
  // Triggered by the messages layout as its infinite scroll trigger (at
  // the top of the list) comes into view, like the thread list's more
  // flow.
  _more() {
    if (this.status !== STATUS.READY) {
      throw new Error(`Can not call more() while loading.`);
    }
    const threadId = this.threadId;
    // nothing to page in new-thread mode, or once the start is reached
    if (!threadId || this.exhausted) {
      return;
    }
    // one page at a time: the trigger can re-arm while a page is being
    // served, since a more request keeps the current messages — and their
    // ready status — on display
    if (this._data.isServing(request => request.type === REQUEST_TYPE.MORE && request.session === this.session)) {
      return;
    }
    // hold while the displayed messages still load their contents: their
    // near-empty shells understate the list's eventual height, so the
    // trigger fires prematurely — and would cascade page after page. Once
    // everything displayed is settled (and the layout at its true height),
    // a still-visible trigger legitimately means the list fits the screen
    const data = this._hub.states[fields.data()];
    if (getUnsettledQuestionIds(data && data.value).length) {
      return;
    }
    // the cursor: the oldest displayed server message — a just-posted live
    // message has no question id, and sits at the bottom anyway
    const first = this.messages[0];
    const after = first && first.question_id;
    if (!after) {
      return;
    }
    const { rows } = this._options.resolved.pagination || {};
    this._request({
      ...getThreadRequest(threadId, trimObj({ order: 'desc', rows, after })),
      type: REQUEST_TYPE.MORE,
      threadId,
      options: THREAD_REQUEST_OPTIONS,
    });
  }

  // A follow-up or a new thread's first question, the question bubble is
  // appended optimistically (`live` marks the pair as being generated in
  // this session; the UI typewrites live answers), and the live message
  // delivers itself: its item subworkflow posts the question and streams the
  // answer, ask-style, with the last message as its parent — a new thread's
  // first question simply has none, making it a root question. The stream folds back into this panel's
  // record (_followLiveMessage).
  //
  // A new thread additionally starts from a placeholder record announced to
  // the history workflow (which lists and selects it), settled once the
  // stream brings the question id (the adoption announcement). The thread
  // has no identity yet — the placeholder record is keyed by a local
  // `placeholder_id` instead of a thread id, so nothing addresses it as a
  // thread server-side. The follow survives this panel's session for the
  // resolution alone, so the resolution lands even if the user leaves the
  // panel before the response arrives.
  // TODO: bad name, use query()

  /**
   * Ask a question in the thread on display, or, if no thread is loaded,
   * start a new thread with it. The question shows right away, and the
   * answer shows as it is generated.
   *
   * @param {string} question - The question.
   * @returns {this}
   */
  send(question, { qs } = {}) {
    if (!question) {
      throw new Error(`question is required in send() call`);
    }
    const data = this._hub.states[fields.data()];
    if (!data || !data.value) {
      return this;
    }
    // starting a new thread, unless one is loaded or already being created
    const placeholder = (this.threadId || (this.thread && this.thread.placeholder_id)) ? undefined : this._startPlaceholderThread(question);
    // posting to an existing thread (or one still being created) is activity
    // on it: its record is stamped with a fresh updated_at, here and on the
    // listed side, which moves it to the top of the thread list
    const thread = placeholder ? undefined : this._touchThread(data.value.thread);
    const messages = data.value.messages || [];
    const last = messages[messages.length - 1];
    // the local placeholder id keys the message (its item binding and its
    // workflow) until the response brings the question id; the record
    // carries its lineage from the start, like a server record does
    const message = trimObj({
      placeholder_id: uuidv4(),
      // a root question of a new thread carries the thread placeholder it
      // creates: the resolution (question id -> thread id) derives from
      // the record, wherever its workflow ends up
      thread_placeholder_id: placeholder && placeholder.placeholder_id,
      question,
      parent_question_id: last && last.question_id,
      live: true,
    });
    this.updateData({
      ...data,
      value: {
        ...data.value,
        ...(placeholder ? { thread: placeholder } : thread ? { thread } : {}),
        messages: [...messages, message],
      },
    });
    const workflow = this._getMessageWorkflow(message);
    this._followLiveMessage(workflow, message);
    workflow.post(message, { qs });
    return this;
  }

  // Follow a live message's own data stream, folding it back into this
  // panel's record (keyed by the local placeholder id) while this session
  // displays it. The follow is display-only: the resolution of a creating
  // thread is the message workflow's own announcement (its question id,
  // adopted or salvaged off an expired response -> _resolveLiveMessage),
  // not the follow's business. It ends with the stream — or on the first
  // commit after the panel has moved on, when there is nothing left to
  // fold into.
  _followLiveMessage(workflow, message) {
    const { placeholder_id } = message;
    const session = this.session;
    const unsubscribe = workflow._hub.on(fields.data(), data => {
      const value = data && data.value;
      if (!value) {
        return;
      }
      if (this.session !== session) {
        unsubscribe();
        return;
      }
      this._patchLiveMessage(placeholder_id, value);
      if (value.finished || value.error) {
        unsubscribe();
      }
    });
  }

  // fold a streamed value into the live message's record on display
  _patchLiveMessage(placeholderId, value) {
    const data = this._hub.states[fields.data()];
    if (!data || !data.value || !data.value.messages) {
      return;
    }
    const messages = data.value.messages.map(m => m.placeholder_id === placeholderId ? { ...m, ...value } : m);
    this.updateData({ ...data, value: { ...data.value, messages } });
  }

  // thread operations //
  // thread-level operations on the thread on display: fire-and-forget
  // requests carrying their events, which come back through the thread
  // events subscriptions, to both panels. They require a loaded thread: a
  // thread being created (or none at all) has no server identity to
  // operate on

  /**
   * Rename the thread on display.
   *
   * @param {string} title - The new title.
   * @throws {Error} If no thread is loaded.
   */
  rename(title) {
    ThreadOperations.prototype.rename.call(this, this._requireThreadId('rename'), title, this.thread.title);
  }

  /**
   * Add the thread on display to, or remove it from, the favorites.
   *
   * @param {boolean} [value=true] - `true` to favorite, `false` to unfavorite.
   * @throws {Error} If no thread is loaded.
   * @since 1.14.2
   */
  favorite(value = true) {
    ThreadOperations.prototype.favorite.call(this, this._requireThreadId('favorite'), value);
  }

  /**
   * Subscribe to answer updates of the thread on display.
   *
   * @throws {Error} If no thread is loaded.
   */
  subscribe() {
    ThreadOperations.prototype.subscribe.call(this, this._requireThreadId('subscribe'));
  }

  /**
   * Unsubscribe from answer updates of the thread on display.
   *
   * @throws {Error} If no thread is loaded.
   */
  unsubscribe() {
    ThreadOperations.prototype.unsubscribe.call(this, this._requireThreadId('unsubscribe'));
  }

  /**
   * Delete the thread on display. The panel then starts a new thread.
   *
   * @throws {Error} If no thread is loaded.
   */
  delete() {
    ThreadOperations.prototype.delete.call(this, this._requireThreadId('delete'));
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

  // stamp the thread on display with a fresh updated_at for a question posted
  // to it, announcing the activity to the history workflow (which moves its
  // listed record to the top), if constructed. Returns the stamped record
  _touchThread(thread) {
    const threadId = thread && (thread.thread_id || thread.placeholder_id);
    if (!threadId) {
      return undefined;
    }
    // TODO: client side time is not reliable, don't use it for comparison with server time
    const touched = { ...thread, updated_at: new Date().toISOString() };
    const peer = this._peer;
    peer && peer._onConversationActivity(threadId, touched);
    return touched;
  }

  /**
   * Start a new thread, with no messages, ready to take the first question.
   * Does nothing if the panel is already on a new thread with nothing asked.
   *
   * @param {Object} [options]
   * @param {boolean} [options.force=false] - Reset even if the panel is already on a new thread.
   * @returns {this}
   */
  new({ force = false } = {}) {
    // a fresh session presenting a placeholder thread
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

  // thread events //
  // called by the history workflow
  _onThreadSelect(threadId) {
    if (threadId === (this.thread && this.thread.placeholder_id)) {
      return; // the thread being created is on display already
    }
    this.load(threadId);
  }

  // an operation, applied optimistically by its type — or the error taking
  // a failed one back
  _onThreadEvent(event) {
    switch (event.type) {
      case 'rename':
      case 'mark-as-read':
      case 'favorite':
      case 'subscribe':
      case 'unsubscribe':
        this._onThreadUpdated(event);
        break;
      case 'delete':
        this._onThreadDeleted(event);
        break;
      case 'delete-all':
        this._onAllThreadsDeleted();
        break;
      case 'error':
        this._onThreadOperationError(event);
        break;
    }
  }

  _onThreadUpdated(operation) {
    const changes = getThreadChanges(operation);
    this._patchThread(operation.threadId, thread => ({ ...thread, ...changes }));
  }

  // patch the record of the thread on display, if it is the given one
  _patchThread(threadId, fn) {
    const data = this._hub.states[fields.data()];
    if (threadId !== this.threadId || !data || !data.value || !data.value.thread) {
      return;
    }
    const thread = fn(data.value.thread);
    if (thread !== data.value.thread) {
      this.updateData({ ...data, value: { ...data.value, thread } });
    }
  }

  // the thread on display is deleted: the panel resets to new-thread mode
  // (a deletion is not rolled back if it fails)
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
  // the search box's submit view event routes to send(): the panel's
  // session belongs to the thread on display, not to the question — there
  // is no query flow here, unlike the query-based workflows
  _onQuerySubmit({ value }) {
    value && this.send(value);
  }

  _onViewRenameSubmit({ value }) {
    if (!value || !this.threadId) {
      return; // a thread being created has no server identity to rename yet
    }
    this.rename(value);
  }

  _onViewDeleteSubmit() {
    if (!this.threadId) {
      return; // a thread being created has no server identity to delete yet
    }
    this.delete();
  }

  _onViewSubscriptionChange({ checked }) {
    if (!this.threadId) {
      return; // a thread being created has no subscription to toggle yet
    }
    checked ? this.subscribe() : this.unsubscribe();
  }

  _onViewFavoriteChange({ checked }) {
    if (!this.threadId) {
      return; // a thread being created has no server identity to star yet
    }
    this.favorite(checked);
  }

  // an inline follow-up link inside a message answer, delegated here by the
  // message workflow — answer-content interactions themselves live on the
  // message item subworkflows
  _onFollowUpClick({ q, event } = {}) {
    if (event.button !== 0) {
      return; // only left click
    }
    this._submitFollowUpQuestion({ q, qs: QUESTION_SOURCE.INLINE_QUESTION_LINK });
  }

  // a suggested follow-up question of a message, delegated here by the
  // message workflow likewise
  _onFollowUpQuestionSelect({ value: q } = {}) {
    this._submitFollowUpQuestion({ q, qs: QUESTION_SOURCE.SUGGESTED_QUESTIONS });
  }

  _submitFollowUpQuestion({ q, qs } = {}) {
    const { ongoing } = this._hub.states[fields.view(ROLE.MESSAGES)] || {};
    if (ongoing) {
      return; // an answer is still being displayed; hold, as the search box does
    }
    q = q ? q.trim() : '';
    q && this.send(q, { qs });
  }

  // interactions //
  // tracker events of the message item subworkflows forward here, stamped
  // with the item's data, and this workflow translates the answer-content
  // interactions: the answer info and the message's lineage read off the
  // forwarded data
  _defaultProcessInteraction(payload, args) {
    payload = super._defaultProcessInteraction(payload, args);
    if (args.workflow._name === 'message-item') {
      payload = writeAnswerInfoToInteraction(payload, args);
      payload = this._writeMessageInfoToInteraction(payload, args);
    }
    return payload;
  }

  // The message's question lineage: the record supplies its own parent
  // question id (the question chain may fork, so message order implies no
  // lineage) and its miso_id, when it carries one; the thread id — the id
  // of the thread's first question, by contract — is the root question id.
  // The question source tells an update message (written by the
  // answer-updates monitor) from an organic (typed) one.
  _writeMessageInfoToInteraction(payload, { data, role }) {
    const message = data && data.value;
    if (!message) {
      return payload;
    }
    return mergeInteractions(payload, trimObj({
      miso_id: message.miso_id,
      context: {
        custom_context: trimObj({
          property: role === ROLE.FOLLOW_UP_QUESTIONS ? 'suggested_followup_questions' : undefined,
          root_question_id: this.threadId,
          parent_question_id: message.parent_question_id,
          question_source: isUpdateMessage(message) ? QUESTION_SOURCE.UPDATE : QUESTION_SOURCE.ORGANIC,
        }),
      },
    }));
  }

  // request //
  // every request of this workflow is fully described at its call site
  // (the head thread request, the answers follow-up), so the api option —
  // which belongs to the message items' question posting (see the
  // 'conversation' defaults entry) — is not merged in
  _request(options = {}) {
    this._writeRequestTimeToSession(Date.now(), options);
    const { session } = this;
    this.updateData({ session, request: options });
    this._hub.update(fields.request(), { ...options, session });
  }

  _writeRequestTimeToSession(timestamp, options = {}) {
    // only the head request marks the session request time
    if (options.type !== REQUEST_TYPE.THREAD) {
      return;
    }
    super._writeRequestTimeToSession(timestamp, options);
  }

  // data //
  // a `threads`-typed (operation) response carries no data: the operation
  // is optimistic, its event having ridden the request already
  _onResponse(response) {
    const { request } = response;
    if (request && request.type === REQUEST_TYPE.THREADS) {
      return;
    }
    super._onResponse(response);
  }

  // Homogenize the value to the canonical { thread, messages } shape, by
  // request type — but merge nothing: merging into the current data happens
  // later, in _updateDataInHub, past the custom data processors, so each
  // piece of data runs through them exactly once, in the one shape.
  _defaultProcessData(data, oldData) {
    data = super._defaultProcessData(data, oldData);
    if (!data.value) {
      return data;
    }
    switch (data.request && data.request.type) {
      case REQUEST_TYPE.ANSWERS:
        // TODO: we will pull partial data later
        return { ...data, value: { messages: normalizeAnswersValue(data.value) } };
      case REQUEST_TYPE.THREAD:
      case REQUEST_TYPE.MORE: {
        // the exhaustion is the page's own word (has_more), read off the
        // raw value before it is homogenized away into the thread record;
        // a desc-fetched page reverses into display (ascending) order
        data = writeHasMoreExhaustionToData(data);
        const { payload } = data.request;
        const value = normalizeThreadValue(data.value, { descending: !!(payload && payload.order === 'desc') });
        return { ...data, value: data.request.type === REQUEST_TYPE.THREAD ? writeThreadAsRead(value) : value };
      }
      default:
        return data;
    }
  }

  _updateDataInHub(data, oldData) {
    // captured before the merge: it restores the head request on the merged
    // data, and swaps the current data in for a valueless update
    const type = data.request && data.request.type;
    if (type === REQUEST_TYPE.ANSWERS) {
      // an erroneous end of the answers stream — its polling already
      // tolerated transient failures — settles every message still waiting
      // with the error mark: the items present it (visible-when), the
      // paging unblocks, and the poll is not re-issued; a later page's
      // unsettled messages start a fresh stream of their own
      data = data.error
        ? writeAnswersErrorToMessages(oldData, data.error)
        : mergeAnswersDataFromResponse(oldData, data);
    } else if (type === REQUEST_TYPE.MORE) {
      data = mergeOlderMessagesFromResponse(oldData, data);
    }
    super._updateDataInHub(data, oldData);
    // propagate the committed records into the message item subworkflows
    this._updateMessageWorkflows();
    if (type === REQUEST_TYPE.THREAD || type === REQUEST_TYPE.MORE) {
      // the page data tells whether there are answer contents to fetch
      this._requestAnswersIfNecessary(data);
    }
  }

  // messages as item subworkflows //
  // The message workflow of the given message: the item subworkflow behind
  // a <miso-message-item> element. Takes the message record — the messages
  // layout passes the item binding's value, which also covers a just-posted
  // message that has no question id yet (keyed by its local placeholder id,
  // adopting the question id when the response arrives) — or a question id,
  // for an explicitly bound element. Created on demand from the messages
  // context (client.workflows.messageItems) and, unless live, seeded with the
  // record on display, if present; from then on, every data commit
  // propagates the record in through updateData(). A live message's workflow
  // delivers its own data (post()), so it is never fed here.
  _getMessageWorkflow(message) {
    const context = this._client.workflows.messageItems;
    if (typeof message === 'string') {
      message = this.messages.find(m => m.question_id === message) || { question_id: message };
    }
    let workflow = context.get(message);
    if (!workflow) {
      workflow = context.get(message, { autoCreate: true, superworkflow: this });
      workflow && !message.live && this.messages.includes(message) && this._updateMessageWorkflow(workflow, message);
    }
    return workflow;
  }

  // the item subworkflows serve the displayed thread: leaving it (restart)
  // destroys them — aborted and deregistered, like Ask's follow-up chain on
  // a root restart; a return to the thread recreates them afresh. A held
  // live follow's workflow (a thread still resolving) survives until its
  // resolution lands
  _destroyMessageWorkflows() {
    const context = this._client.workflows._messageItems;
    if (!context) {
      return;
    }
    for (const message of this.messages) {
      const workflow = context.get(message);
      workflow && workflow.destroy();
    }
  }

  // propagate the committed records — only ever into existing message
  // workflows: instances are created by elements (_getMessageWorkflow), not
  // by data, so nothing is constructed when <miso-message-item> is not in play
  _updateMessageWorkflows() {
    const context = this._client.workflows._messageItems;
    if (!context) {
      return;
    }
    for (const message of this.messages) {
      if (message.live) {
        continue; // a live message's workflow delivers its own data
      }
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

  // Opening a thread marks it as read, right at load time. The unread state
  // is read off the peer's listed record; with no history workflow around,
  // no unread state is tracked and nothing is marked.
  _markAsReadIfNecessary(threadId) {
    /*
    const history = this._peer;
    if (!history || !isThreadUnread(history.get(threadId))) {
      // TODO: check spec: do we always want to mark as read?
      return;
    }
    */
    ThreadOperations.prototype.markAsRead.call(this, threadId);
  }

  // Settle a started new thread the moment its first question's id is
  // known: by contract the thread id *is* that question id, so the
  // resolution involves no server round trip at all. The history workflow,
  // if constructed, settles its listed placeholder item (a no-op if already
  // settled); the panel's own record settles only if the thread is still on
  // display — the user may have moved on, and the listed side settles all
  // the same. Called when a live message adopted (or salvaged) its question
  // id. A departed workflow needs nothing more here: the sweep destroyed it
  // uniformly, its resolution arriving off the expired-response salvage
  _resolveLiveMessage(placeholderId, questionId) {
    const peer = this._peer;
    peer && peer._onConversationResolve(placeholderId, questionId);
    const data = this._hub.states[fields.data()];
    const thread = data && data.value && data.value.thread;
    if (!this.destroyed && thread && thread.placeholder_id === placeholderId) {
      this.updateData({ ...data, value: { ...data.value, thread: settlePlaceholder(thread, questionId) } });
    }
  }

  // The head data tells whether there are answer contents to fetch: any
  // (non-live) message whose answer is absent or unfinished starts the
  // answers polling — one request per session, answered by the answers api
  // with a polling iterable the data actor consumes like an ask answer
  // stream. The question ids are given as a function, resolved by the api
  // for every poll off the current data: settled messages drop out between
  // polls and new ones (e.g. further pages, later) are picked up — an
  // unfinished answer is re-polled regardless of how the panel got here
  // (posted in this session, or reloaded mid-generation) — until nothing is
  // left, ending the stream; asking the actor whether an answers request of
  // this session is still being served tells a running poll from a settled
  // one, so a later unsettled batch starts a new one.
  // The actor supplies the abort on new session; the api-layer polling
  // drops a late, outdated response.
  _requestAnswersIfNecessary(data) {
    if (this._data.isServing(request => request.type === REQUEST_TYPE.ANSWERS && request.session === this.session)) {
      return; // the running poll picks up new unsettled messages by itself
    }
    if (!getUnsettledQuestionIds(data.value).length) {
      return;
    }
    this._request({
      ...ANSWERS_REQUEST,
      type: REQUEST_TYPE.ANSWERS,
      payload: {
        question_ids: () => {
          const current = this._hub.states[fields.data()];
          const ids = getUnsettledQuestionIds(current && current.value);
          // the content loads incrementally too: each poll's batch is
          // capped, newest first — the view is bottom-anchored, so the
          // newest unsettled messages are the ones on (or nearest) the
          // screen — and the stream walks up batch by batch as they settle
          const { answersRows } = this._options.resolved.pagination || {};
          return answersRows ? ids.slice(-answersRows) : ids;
        },
      },
    });
  }


  // destroy //
  // the panel's teardown ends the displayed thread's items the same way a
  // departure does
  _destroy(options) {
    this._destroyMessageWorkflows();
    super._destroy(options);
  }

}

mixinThreadOperationSupport(Conversation.prototype);

makeConfigurable(Conversation.prototype);

makeConfigurable(Conversation.prototype, [WORKFLOW_CONFIGURABLE.PAGINATION]);

export default Conversation;
