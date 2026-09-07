import Workflow from './base.js';
import { fields } from '../actor/index.js';
import { ROLE } from '../constants.js';
import { mergeRolesOptions } from './options/index.js';
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
 * A peer of the Conversation workflow: the two are created independently,
 * and every call to the peer is guarded by its presence, so the thread list
 * works standalone. Thread mutations go through the shared ThreadsModel,
 * whose facts both peers subscribe to (_onThreadUpdated, ...).
 */
export default class History extends Workflow {

  constructor(plugin, client, model) {
    super({
      name: 'history',
      plugin,
      client,
      roles: ROLES_OPTIONS,
      model,
    });
  }

  _initProperties(args) {
    super._initProperties(args);
    this._model = args.model;
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
      // thread facts from the shared model
      this._model.on('updated', event => this._onThreadUpdated(event)),
      this._model.on('deleted', event => this._onThreadDeleted(event)),
      this._model.on('all-deleted', () => this._onAllThreadsDeleted()),
    ];
  }

  // properties //
  get threads() {
    const data = this._hub.states[fields.data()];
    return (data && data.value && data.value.threads) || [];
  }

  /**
   * The id of the selected thread item. The selection lives in the data
   * layer, as part of the committed value.
   */
  get selectedId() {
    const data = this._hub.states[fields.data()];
    return (data && data.value && data.value.selectedThreadId) || undefined;
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
   * fetch if any.
   */
  refresh() {
    this._started = true;
    this.restart();
    this._request();
    return this;
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

  // thread mutations, on the shared model — the facts come back through the
  // model subscriptions
  rename(threadId, title) {
    this._model.rename(threadId, title);
  }

  markAsRead(threadId) {
    this._model.markAsRead(threadId);
  }

  subscribe(threadId) {
    this._model.subscribe(threadId);
  }

  unsubscribe(threadId) {
    this._model.unsubscribe(threadId);
  }

  delete(threadIds) {
    this._model.delete(threadIds);
  }

  deleteAll() {
    this._model.deleteAll();
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
    // TODO: what happens if deleting a placeholder thread?
    const threadId = thread && thread.thread_id;
    threadId && this.delete(threadId);
  }

  // fact handlers //
  _onThreadUpdated({ threadId, changes }) {
    this._patchValue({ threads: this.threads.map(thread => thread.thread_id === threadId ? { ...thread, ...changes } : thread) });
  }

  _onThreadDeleted({ threadIds }) {
    const removed = new Set(threadIds);
    this._patchValue({
      threads: this.threads.filter(thread => !removed.has(thread.thread_id)),
      ...(threadIds && threadIds.includes(this.selectedId) ? { selectedThreadId: undefined } : {}),
    });
  }

  _onAllThreadsDeleted() {
    this._patchValue({ threads: [], selectedThreadId: undefined });
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
    const context = this._client.workflows._threads;
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
    if (!data.value) {
      return data;
    }
    // the selection is part of the value: local patches carry their own
    // (including an explicit undefined to clear it), while a fresh server
    // response carries none — the current selection is carried over, so it
    // survives a refresh
    const selectedThreadId = oldData && oldData.value && oldData.value.selectedThreadId;
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
    return { ...data, value };
  }

  _updateDataInHub(data, oldData) {
    super._updateDataInHub(data, oldData);
    this._updateThreadWorkflows();
  }

  // threads as item subworkflows //
  /**
   * The thread workflow of the given thread: the item subworkflow behind a
   * <miso-thread> element. Takes the thread record — the threads layout
   * passes the item binding's value, which also covers a thread being
   * created that has no thread id yet (keyed by its local placeholder id,
   * adopting the thread id when the placeholder settles) — or a thread id,
   * for an explicitly bound element. Created on demand from the threads
   * context (client.workflows.threads) and seeded with the listed record,
   * if present; from then on, every data commit propagates the record in
   * through updateData().
   */
  getThreadWorkflow(thread) {
    const context = this._client.workflows.threads;
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
  // workflows: instances are created by elements (getThreadWorkflow), not by
  // data, so nothing is constructed when <miso-thread> is not in play
  _updateThreadWorkflows() {
    const context = this._client.workflows._threads;
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

}
