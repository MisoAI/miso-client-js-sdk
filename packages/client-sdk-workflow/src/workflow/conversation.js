import { API, trimObj, uuidv4 } from '@miso.ai/commons';
import Workflow from './base.js';
import { fields } from '../actor/index.js';
import { ROLE, REQUEST_TYPE } from '../constants.js';
import { mergeRolesOptions, makeConfigurable } from './options/index.js';
import { writeThreadAsRead } from './processors.js';
import { isThreadUnread, settlePlaceholder, normalizeThreadValue, normalizeAnswersValue, getUnsettledQuestionIds, mergeAnswersDataFromResponse } from '../util/threads.js';

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
 * The workflow's sole api option is the answers api; the head (thread)
 * request is served by the shared ThreadsModel with its identity spelled
 * out at the call site, and the question posting belongs to the live
 * message workflow. The data flow takes two requests per session, both going down the standard
 * data path — `_request()` → hub `request` → fetch → hub `response` — in
 * the manner of search-based workflows' query/more requests, with the
 * handling split by `request.type` (REQUEST_TYPE) on the way in:
 *
 * 1. THREAD (head): `GET threads/{id}` retrieves the thread
 *    detail: the thread record — assumed to carry the same properties as
 *    the thread list API — and its turns, as question ids (or records
 *    without answer bodies). Fetched through the shared ThreadsModel in
 *    place of the data actor (see _onRequest).
 * 2. ANSWERS (follow-up, the workflow's api option): when the head data
 *    lands with unsettled messages, a polling request is issued — the
 *    answers api returns a polling iterable (question_ids given as a
 *    function, resolved per poll; _requestAnswersIfNecessary) that the data
 *    actor consumes like an ask answer stream. Its responses are merged
 *    into the head data's messages rather than replacing it, and its
 *    loading update keeps the head data on display
 *    (`mergeAnswersDataFromResponse`, in the manner of
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
      this._hub.on(fields.request(), request => this._onRequest(request)),
      this._views.on(ROLE.QUERY, 'submit', event => this._onQuerySubmit(event)),
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
    // the state of the load. The head request is not an api option — it is
    // served by the shared ThreadsModel (actor: false bypasses the data
    // actor) — so its identity is spelled out here
    this._request({
      actor: false,
      group: API.GROUP.ASK_USER_HISTORY,
      name: `${API.NAME.THREADS}/${threadId}`,
      options: { method: 'GET' },
      type: REQUEST_TYPE.THREAD,
      threadId,
    });
    return this;
  }

  /**
   * Send a question: a follow-up to the current thread, or, in new-thread
   * mode (no thread loaded), the first question of a new thread. Either way,
   * the question bubble is appended optimistically (`live` marks the pair as
   * being generated in this session; the UI typewrites live answers), and
   * the live message delivers itself: its item subworkflow posts the
   * question and streams the answer, ask-style, with the last message as
   * its parent — a new thread's first question simply has none, making it a
   * root question. The stream folds back into this panel's record
   * (_followLiveMessage).
   *
   * A new thread additionally starts from a placeholder record announced to
   * the history workflow (which lists and selects it), settled once the
   * stream brings the question id (_resolvePlaceholder). The thread has no
   * identity yet — the placeholder record is keyed by a local
   * `placeholder_id` instead of a thread id, so nothing addresses it as a
   * thread server-side. The message workflow outlives this panel's session,
   * so the resolution lands even if the user leaves the panel before the
   * response arrives.
   */
  // TODO: bad name, use query()
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
    // the local placeholder id keys the message (its item binding and its
    // workflow) until the response brings the question id; the record
    // carries its lineage from the start, like a server record does
    const message = trimObj({
      placeholder_id: uuidv4(),
      question,
      parent_question_id: last && last.question_id,
      live: true,
    });
    this.updateData({
      ...data,
      value: {
        ...data.value,
        ...(placeholder ? { thread: placeholder } : {}),
        messages: [...messages, message],
      },
    });
    const workflow = this.getMessageWorkflow(message);
    this._followLiveMessage(workflow, message, placeholder);
    workflow.post(message);
    return this;
  }

  /**
   * Follow a live message's own data stream, folding it back into this
   * panel's record (keyed by the local placeholder id) and settling the
   * placeholder thread as soon as the question id shows up. The message
   * workflow outlives this panel's session: after a switch away, the fold
   * simply misses (the panel is on other data by now) while the placeholder
   * resolution still lands on the listed side.
   */
  _followLiveMessage(workflow, message, placeholder) {
    const { placeholder_id } = message;
    const session = this.session;
    let resolved = false, done = false;
    const unsubscribe = workflow._hub.on(fields.data(), data => {
      const value = data && data.value;
      if (done || !value) {
        return;
      }
      if (placeholder && !resolved && value.question_id) {
        resolved = true;
        this._resolvePlaceholder(placeholder, value.question_id);
      }
      if (this.session === session) {
        this._patchLiveMessage(placeholder_id, value);
      }
      if (value.finished) {
        done = true;
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

  /**
   * The thread (head) request is served by the shared ThreadsModel in place
   * of the data actor — its api entry declares `actor: false`, so the actor
   * bypasses it. The request still goes down the standard path: `_request()`
   * publishes the request event, this wiring fetches through the model, and
   * the response enters the hub response field like any other (a stale one
   * is dropped by the session check in updateData).
   */
  _onRequest({ session, ...request }) {
    if (request.type !== REQUEST_TYPE.THREAD) {
      return; // the data actor serves the rest
    }
    this._requestThreadFromModel(session, request);
  }

  async _requestThreadFromModel(session, request) {
    try {
      const value = await this._model.getThread(request.threadId);
      this._hub.update(fields.response(), { session, request, value });
    } catch (error) {
      this._hub.update(fields.response(), { session, request, error });
    }
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
      case REQUEST_TYPE.THREAD:
        return { ...data, value: writeThreadAsRead(normalizeThreadValue(data.value)) };
      default:
        return data;
    }
  }

  _updateDataInHub(data, oldData) {
    // captured before the merge: it restores the head request on the merged
    // data, and swaps the current data in for a valueless update
    const type = data.request && data.request.type;
    if (type === REQUEST_TYPE.ANSWERS) {
      data = mergeAnswersDataFromResponse(oldData, data);
    }
    super._updateDataInHub(data, oldData);
    // propagate the committed records into the message item subworkflows
    this._updateMessageWorkflows();
    if (type === REQUEST_TYPE.THREAD) {
      // the head data tells whether there are answer contents to fetch
      this._requestAnswersIfNecessary(data);
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
   * context (client.workflows.messages) and, unless live, seeded with the
   * record on display, if present; from then on, every data commit
   * propagates the record in through updateData(). A live message's workflow
   * delivers its own data (post()), so it is never fed here.
   */
  getMessageWorkflow(message) {
    const context = this._client.workflows.messages;
    if (typeof message === 'string') {
      message = this.messages.find(m => m.question_id === message) || { question_id: message };
    }
    let workflow = context.get(message);
    if (!workflow) {
      workflow = context.get(message, { autoCreate: true });
      workflow && !message.live && this.messages.includes(message) && this._updateMessageWorkflow(workflow, message);
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
   * Settle a started new thread the moment its first question's id is
   * known: by contract the thread id *is* that question id, so the
   * resolution involves no server round trip at all. The history workflow,
   * if constructed, settles its listed placeholder item (a no-op if already
   * settled); the panel's own record settles only if the thread is still on
   * display — the user may have moved on, and the listed side settles all
   * the same.
   */
  _resolvePlaceholder(placeholder, questionId) {
    const peer = this._peer;
    peer && peer._onConversationResolve(placeholder.placeholder_id, questionId);
    const data = this._hub.states[fields.data()];
    const thread = data && data.value && data.value.thread;
    if (thread && thread.placeholder_id === placeholder.placeholder_id) {
      this.updateData({ ...data, value: { ...data.value, thread: settlePlaceholder(thread, questionId) } });
    }
  }

  /**
   * The head data tells whether there are answer contents to fetch: any
   * (non-live) message whose answer is absent or unfinished starts the
   * answers polling — one request per session, answered by the answers api
   * with a polling iterable the data actor consumes like an ask answer
   * stream. The question ids are given as a function, resolved by the api
   * for every poll off the current data: settled messages drop out between
   * polls and new ones (e.g. further pages, later) are picked up — an
   * unfinished answer is re-polled regardless of how the panel got here
   * (posted in this session, or reloaded mid-generation) — until nothing is
   * left, ending the stream; the actor's `polling` state tells a running
   * poll from a settled one, so a later unsettled batch starts a new one.
   * The actor supplies the abort on new session; the api-layer polling
   * drops a late, outdated response.
   */
  _requestAnswersIfNecessary(data) {
    if (this._data.polling) {
      return; // the running poll picks up new unsettled messages by itself
    }
    if (!getUnsettledQuestionIds(data.value).length) {
      return;
    }
    this._request({
      type: REQUEST_TYPE.ANSWERS,
      payload: {
        question_ids: () => {
          const current = this._hub.states[fields.data()];
          return getUnsettledQuestionIds(current && current.value);
        },
      },
    });
  }

}

makeConfigurable(Conversation.prototype);
