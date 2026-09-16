import { asArray } from '@miso.ai/commons';
import Workflow from './base.js';
import { fields } from '../actor/index.js';
import { ROLE, STATUS, REQUEST_TYPE, WORKFLOW_CONFIGURABLE } from '../constants.js';
import { mergeRolesOptions, makeConfigurable } from './options/index.js';
import { mixinThreadOperations, ThreadOperations } from './thread-operations.js';
import { writeHasMoreExhaustionToData } from './processors.js';
import { settlePlaceholder, normalizeThreadsValue, sortThreadsByLatest } from '../util/threads.js';

const ROLES_OPTIONS = mergeRolesOptions(Workflow.ROLES_OPTIONS, {
  main: ROLE.THREADS,
  members: [ROLE.THREADS, ROLE.NEW_THREAD],
  mappings: {
    // the records carry their selection state in the data layer already
    [ROLE.THREADS]: data => data.value && data.value.threads,
  },
});

/**
 * The thread-list panel of the chat history interface, backed by the user
 * history API. Loads the list of threads and manages thread-level operations
 * (select, rename, delete, mark as read).
 *
 * The list is the workflow's main api option: the endpoint is fixed, but
 * the paging window rides the payload (useApi('threads/list', { rows: N })),
 * and the list loads page by page — the more flow appends the next page
 * (`start` derived from the listed records) in the same session, triggered
 * by the threads layout's infinite scroll, until the response says
 * `has_more: false` (the exhaustion is the response's own word, not a
 * row-count inference).
 *
 * A peer of the Conversation workflow: the two are created independently,
 * and every call to the peer is guarded by its presence, so the thread list
 * works standalone. Thread operations are fire-and-forget requests carrying
 * their facts, triggered off the request event as `thread` hub events — on
 * both peers' hubs — which each panel handles off its own hub
 * (_onThreadUpdated, ...).
 */
export default class History extends Workflow {

  constructor(plugin, client, events) {
    super({
      name: 'history',
      plugin,
      client,
      roles: ROLES_OPTIONS,
      // the thread events channel shared with the conversation panel's data
      // actor, carrying the thread operation facts across the two hubs
      extraOptions: { api: { threadEvents: events } },
    });
  }

  _initProperties(args) {
    super._initProperties(args);
    this._started = false;
  }

  // the conversation panel workflow, if constructed
  get _peer() {
    return this._client.workflows._conversation;
  }

  _initSubscriptions(args) {
    super._initSubscriptions(args);
    this._unsubscribes = [
      ...this._unsubscribes,
      this._views.on(ROLE.THREADS, 'select', event => this._onViewThreadsSelect(event)),
      this._views.on(ROLE.THREADS, 'rename', event => this._onViewThreadsRename(event)),
      this._views.on(ROLE.THREADS, 'delete', event => this._onViewThreadsDelete(event)),
      this._views.on(ROLE.NEW_THREAD, 'submit', () => this._onViewNewThreadSubmit()),
      // the threads layout's infinite scroll trigger, as in the
      // search-based workflows' more flow
      this._hub.on(fields.more(), () => this._more()),
      // an operation's fact rides its request: the
      // data actor publishes it on the shared channel and every subscribed
      // actor — this panel's and its peer's — triggers it on its own hub
      this._hub.on(fields.thread(), fact => this._onThreadEvent(fact)),
    ];
  }

  // properties //
  get threads() {
    const data = this._hub.states[fields.data()];
    return (data && data.value && data.value.threads) || [];
  }

  /**
   * Whether the thread list is known to be complete: the latest page's
   * response said `has_more: false`. Cleared with the session on refresh().
   */
  get exhausted() {
    const data = this._hub.states[fields.data()];
    return !!(data && data.meta && data.meta.exhausted);
  }

  /**
   * The id of the selected thread item. The selection lives in the data
   * layer, as part of the committed value — or, on the valueless commits
   * of a reload, as the top-level field bridging it to the fresh response.
   */
  get selectedId() {
    const data = this._hub.states[fields.data()];
    return (data && (data.value ? data.value.selectedThreadId : data.selectedThreadId)) || undefined;
  }

  /**
   * The listed record of a thread, by thread id — or, for a thread being
   * created, by the placeholder id standing in for one.
   */
  get(threadId) {
    return this.threads.find(thread => (thread.thread_id || thread.placeholder_id) === threadId);
  }

  // lifecycle //
  /**
   * Load the thread list. Idempotent: only the first call takes effect; use
   * refresh() to reload.
   */
  start() {
    if (!this._started) {
      this._started = true;
      this.refresh();
    }
    return this;
  }

  /**
   * Reload the thread list. Starts a new session, aborting an in-flight
   * fetch if any, and starts over from the first page. The request's
   * identity and paging window come from the workflow's api option.
   */
  refresh() {
    this._started = true;
    this.restart();
    this._request();
    return this;
  }

  /**
   * Load the next page of the thread list, appended below the listed
   * threads — same session, down the standard data path. Triggered by the
   * threads layout as its infinite scroll trigger comes into view (the
   * `more` hub field), like the search-based workflows' more flow.
   */
  _more() {
    if (this.status !== STATUS.READY) {
      throw new Error(`Can not call more() while loading.`);
    }
    // no more pages, ignore
    if (this.exhausted) {
      return;
    }
    // a more request keeps the current data — and status — on display, so
    // the trigger can re-arm while the page is being served: one at a time
    if (this._data.isServing(request => request.type === REQUEST_TYPE.MORE && request.session === this.session)) {
      return;
    }
    // the next offset: the listed records with a server identity — a
    // thread still being created is local, its placeholder record never
    // counts toward the server's offsets
    const start = this.threads.filter(thread => thread.thread_id).length;
    this._request({ payload: { start }, type: REQUEST_TYPE.MORE });
  }

  // a more request must not disturb the session's request time, as in the
  // search-based workflows
  _writeRequestTimeToSession(timestamp, options = {}) {
    if (options.type === REQUEST_TYPE.MORE) {
      return;
    }
    super._writeRequestTimeToSession(timestamp, options);
  }

  /**
   * Mark a thread as selected and load it into the conversation panel.
   */
  select(threadId) {
    if (!threadId) {
      throw new Error(`threadId is required in select() call`);
    }
    const thread = this.get(threadId);
    this._patchValue({ selectedThreadId: threadId });
    this._emit('select', Object.freeze({ threadId, thread }));
    // a thread being created has no server identity to load: the placeholder
    // id never addresses the API, and the panel either already displays the
    // thread or has nothing to fetch
    if (!(thread && thread.placeholder_id)) {
      const peer = this._peer;
      peer && peer._onThreadSelect(threadId);
    }
    return this;
  }

  // thread operations: the id-based methods mixed in from ThreadOperations
  // (markAsRead, subscribe, unsubscribe, deleteAll), except rename and
  // delete, specialized here with a guard — a thread still being created
  // has no server identity to operate on, so its placeholder id is ignored
  // until the resolution brings the thread id
  rename(threadId, title) {
    const thread = this.get(threadId);
    if (thread && thread.placeholder_id) {
      return;
    }
    ThreadOperations.prototype.rename.call(this, threadId, title);
  }

  delete(threadIds) {
    threadIds = asArray(threadIds).filter(threadId => {
      const thread = this.get(threadId);
      return !(thread && thread.placeholder_id);
    });
    if (threadIds.length === 0) {
      return;
    }
    ThreadOperations.prototype.delete.call(this, threadIds);
  }

  // view actions //
  _onViewNewThreadSubmit() {
    if (!this.selectedId) {
      return;
    }
    this._patchValue({ selectedThreadId: undefined });
    this._emit('new', {});
    const peer = this._peer;
    peer && peer.new();
  }

  _onViewThreadsSelect({ value: thread }) {
    const threadId = thread && thread.thread_id;
    threadId && this.select(threadId);
  }

  _onViewThreadsRename({ value: thread, title }) {
    const threadId = thread && thread.thread_id;
    threadId && title && this.rename(threadId, title);
  }

  _onViewThreadsDelete({ value: thread }) {
    // a placeholder item has no thread id, so a thread being created never
    // reaches the API from here
    const threadId = thread && thread.thread_id;
    threadId && this.delete(threadId);
  }

  // data //
  // a `threads`-typed (operation) response carries no data: the operation
  // is optimistic, its fact having ridden the request already
  _onResponse(response) {
    const { request } = response;
    if (request && request.type === REQUEST_TYPE.THREADS) {
      return;
    }
    super._onResponse(response);
  }

  // thread events //
  _onThreadEvent(fact) {
    switch (fact.event) {
      case 'updated':
        this._onThreadUpdated(fact);
        break;
      case 'deleted':
        this._onThreadDeleted(fact);
        break;
      case 'all-deleted':
        this._onAllThreadsDeleted();
        break;
    }
  }

  _onThreadUpdated({ threadId, changes }) {
    this._patchValue({ threads: this.threads.map(thread => thread.thread_id === threadId ? { ...thread, ...changes } : thread) });
  }

  _onThreadDeleted({ threadIds }) {
    const removed = new Set(threadIds);
    this._patchValue({
      threads: this.threads.filter(thread => !removed.has(thread.thread_id)),
      ...(threadIds && threadIds.includes(this.selectedId) ? { selectedThreadId: undefined } : {}),
    });
    // a deleted thread's item subworkflow has nothing left to present
    const context = this._client.workflows._threadItems;
    if (context) {
      for (const threadId of threadIds) {
        const workflow = context.get({ thread_id: threadId });
        workflow && workflow.destroy();
      }
    }
  }

  _onAllThreadsDeleted() {
    this._patchValue({ threads: [], selectedThreadId: undefined });
    const context = this._client.workflows._threadItems;
    context && context.reset();
  }

  // called by the conversation workflow //
  // a new thread is started in the conversation panel: list its placeholder
  // as the selected item (its fresh timestamp sorts it to the top). The
  // record has no thread id yet, so it is selected by its placeholder id
  _onConversationNew(thread) {
    this._patchValue({
      threads: [...this.threads, thread],
      selectedThreadId: thread.placeholder_id,
    });
  }

  // the new thread is created server-side: the thread id is the only thing
  // the resolution gains — settle the listed placeholder item around it
  _onConversationResolve(placeholderId, threadId) {
    if (!this.get(placeholderId)) {
      return; // already settled (announced from both the live and the expired path)
    }
    // the item subworkflow adopts the thread id first, so the settled record
    // propagates into the same workflow the placeholder was keyed to
    const context = this._client.workflows._threadItems;
    context && context._resolvePlaceholder(placeholderId, threadId);
    this._patchValue({
      threads: this.threads.map(thread =>
        thread.placeholder_id === placeholderId ? settlePlaceholder(thread, threadId) : thread),
      ...(this.selectedId === placeholderId ? { selectedThreadId: threadId } : {}),
    });
  }

  // data //
  _defaultProcessData(data, oldData) {
    data = super._defaultProcessData(data, oldData);
    // the selection is part of the value: local patches carry their own
    // (including an explicit undefined to clear it), while a fresh server
    // response carries none — the current selection is carried over, so it
    // survives a refresh. The valueless commits in between (the session
    // reset, the loading commit) carry it as a top-level field, bridging
    // it from the wiped value over to the fresh response
    const selectedThreadId = oldData && (oldData.value ? oldData.value.selectedThreadId : oldData.selectedThreadId);
    if (!data.value) {
      return selectedThreadId === undefined ? data : { ...data, selectedThreadId };
    }
    const value = { selectedThreadId, ...normalizeThreadsValue(data.value) };
    // threads are canonically ordered by latest activity, and each record
    // carries its selection state, so views render it right off the data.
    // A record whose flag already matches keeps its identity — record
    // identity tells the item subworkflows (and their views) what actually
    // changed, so a stamp-only pass must not touch the unaffected records
    value.threads = sortThreadsByLatest(value.threads).map(thread => {
      const selected = (thread.thread_id || thread.placeholder_id) === value.selectedThreadId;
      return !!thread.selected === selected ? thread : { ...thread, selected };
    });
    // the paged responses carry `has_more`, which rides the value into
    // every commit, so re-processing (a local patch) restamps consistently
    return writeHasMoreExhaustionToData({ ...data, value });
  }

  _updateDataInHub(data, oldData) {
    data = this._appendThreadsFromMoreResponse(data);
    super._updateDataInHub(data, oldData);
    this._updateThreadWorkflows();
  }

  // merge a more page into the current data past the data processor passes,
  // like the search-based more flow: each page runs the pipeline once, alone
  _appendThreadsFromMoreResponse(data) {
    const { request } = data;
    if (!request || request.type !== REQUEST_TYPE.MORE) {
      return data;
    }
    const current = this._hub.states[fields.data()];
    if (!data.value) {
      // the more request's loading commit: keep the current list on display
      return current || data;
    }
    const threads = (current && current.value && current.value.threads) || [];
    // a record listed already is dropped from the page: a thread created
    // since the first page shifts the server's offsets, so a page may
    // overlap what is on display
    const listed = new Set(threads.map(thread => thread.thread_id));
    const fresh = data.value.threads.filter(thread => !listed.has(thread.thread_id));
    return {
      ...data,
      value: {
        ...data.value,
        threads: [...threads, ...fresh],
      },
    };
  }

  // threads as item subworkflows //
  /**
   * The thread workflow of the given thread: the item subworkflow behind a
   * <miso-thread-item> element. Takes the thread record — the threads layout
   * passes the item binding's value, which also covers a thread being
   * created that has no thread id yet (keyed by its local placeholder id,
   * adopting the thread id when the placeholder settles) — or a thread id,
   * for an explicitly bound element. Created on demand from the threads
   * context (client.workflows.threadItems) and seeded with the listed record,
   * if present; from then on, every data commit propagates the record in
   * through updateData().
   */
  _getThreadWorkflow(thread) {
    const context = this._client.workflows.threadItems;
    if (typeof thread === 'string') {
      thread = this.get(thread) || { thread_id: thread };
    }
    let workflow = context.get(thread);
    if (!workflow) {
      workflow = context.get(thread, { autoCreate: true, superworkflow: this });
      workflow && this.threads.includes(thread) && this._updateThreadWorkflow(workflow, thread);
    }
    return workflow;
  }

  // propagate the committed records — only ever into existing thread
  // workflows: instances are created by elements (_getThreadWorkflow), not by
  // data, so nothing is constructed when <miso-thread-item> is not in play
  _updateThreadWorkflows() {
    const context = this._client.workflows._threadItems;
    if (!context) {
      return;
    }
    for (const thread of this.threads) {
      const workflow = context.get(thread);
      workflow && this._updateThreadWorkflow(workflow, thread);
    }
  }

  _updateThreadWorkflow(workflow, thread) {
    if (workflow.thread === thread) {
      return; // the very record on display already, nothing to propagate
    }
    workflow.updateData({ session: workflow.session, value: thread });
  }

  // patch the committed value — the threads, the selection, or both at once
  _patchValue(patch) {
    const data = this._hub.states[fields.data()];
    if (!data || !data.value) {
      return; // the list is not loaded yet, nothing to patch
    }
    this.updateData({ ...data, value: { ...data.value, ...patch } });
  }


  // destroy //
  // the list's teardown takes its item subworkflows with it
  _destroy(options) {
    const context = this._client.workflows._threadItems;
    context && context.reset(options);
    super._destroy(options);
  }

}

mixinThreadOperations(History.prototype);

makeConfigurable(History.prototype, [WORKFLOW_CONFIGURABLE.PAGINATION]);
