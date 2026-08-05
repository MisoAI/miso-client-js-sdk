import { asArray } from '@miso.ai/commons';
import Workflow from './base.js';
import { fields } from '../actor/index.js';
import { ROLE } from '../constants.js';
import { mergeRolesOptions } from './options/index.js';
import { getThreadId, getPlaceholderId, settlePlaceholder, normalizeThreadsValue, sortThreadsByLatest } from '../util/threads.js';

const ROLES_OPTIONS = mergeRolesOptions(Workflow.ROLES_OPTIONS, {
  main: ROLE.THREADS,
  members: [ROLE.THREADS, ROLE.NEW_CHAT],
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
 * Mutations follow an event-sourced pattern: a mutation method calls the API,
 * then applies the fact to both panels through the shared handler methods
 * (_onThreadUpdated / _onThreadDeleted / ... on this workflow and on the
 * conversation subworkflow), so a change goes through the same code path
 * whichever panel it originated from.
 */
export default class History extends Workflow {

  constructor(plugin, client) {
    super({
      name: 'history',
      plugin,
      client,
      roles: ROLES_OPTIONS,
    });
  }

  _initProperties(args) {
    super._initProperties(args);
    // the conversation panel is a subworkflow (like hybrid-search/answer),
    // lazily constructed by the workflows interface (client.workflows
    // .conversation); every call to it below is guarded by its presence
    this._conversation = undefined;
    this._started = false;
  }

  _initSubscriptions(args) {
    super._initSubscriptions(args);
    this._unsubscribes = [
      ...this._unsubscribes,
      this._views.on(ROLE.THREADS, 'select', event => this._onViewThreadSelect(event)),
      this._views.on(ROLE.THREADS, 'rename', event => this._onViewThreadRename(event)),
      this._views.on(ROLE.THREADS, 'delete', event => this._onViewThreadDelete(event)),
      this._views.on(ROLE.NEW_CHAT, 'submit', () => this._onViewNetChatSubmit()),
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
    return this.threads.find(thread => (getThreadId(thread) || getPlaceholderId(thread)) === threadId);
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
    this._patchValue({ selectedThreadId: threadId });
    const event = Object.freeze({ threadId, thread: this.get(threadId) });
    this._emit('select', event);
    this._conversation && this._conversation._onThreadSelect(event);
    return this;
  }

  // mutations //
  async rename(threadId, title) {
    this._api.updateThread(threadId, { title }); // no await
    this._applyThreadUpdate(Object.freeze({ threadId, changes: { title } }));
  }

  async markAsRead(threadId) {
    this._api.markThreadAsRead(threadId); // no await
    this._applyThreadUpdate(Object.freeze({ threadId, changes: { has_new: false } }));
  }

  /**
   * Delete one or more threads: takes a thread id or an array of them.
   */
  async delete(threadIds) {
    threadIds = asArray(threadIds);
    if (!threadIds.length) {
      return;
    }
    this._api.deleteThreads({ thread_ids: threadIds }); // no await
    const event = Object.freeze({ threadIds });
    this._onThreadDeleted(event);
    this._conversation && this._conversation._onThreadDeleted(event);
  }

  async deleteAll() {
    this._api.deleteAllThreads(); // no await
    this._onAllThreadsDeleted();
    this._conversation && this._conversation._onAllThreadsDeleted();
  }

  // apply a fact to both panels, so the change goes through the same code
  // path whichever panel it originated from
  _applyThreadUpdate(event) {
    this._onThreadUpdated(event);
    this._conversation && this._conversation._onThreadUpdated(event);
  }

  get _api() {
    return this._client.api.ask.userHistory;
  }

  // view actions //
  _onViewNetChatSubmit() {
    if (!this.selectedId) {
      return;
    }
    this._patchValue({ selectedThreadId: undefined });
    this._emit('new', {});
    this._conversation && this._conversation.new();
  }

  _onViewThreadSelect({ value: thread }) {
    const threadId = getThreadId(thread);
    threadId && this.select(threadId);
  }

  _onViewThreadRename({ value: thread, title }) {
    const threadId = getThreadId(thread);
    threadId && title && this.rename(threadId, title);
  }

  _onViewThreadDelete({ value: thread }) {
    // TODO: what happens if deleting a placeholder thread?
    const threadId = getThreadId(thread);
    threadId && this.delete(threadId);
  }

  // fact handlers //
  _onThreadUpdated({ threadId, changes }) {
    this._patchValue({ threads: this.threads.map(thread => getThreadId(thread) === threadId ? { ...thread, ...changes } : thread) });
  }

  _onThreadDeleted({ threadIds }) {
    const removed = new Set(threadIds);
    this._patchValue({
      threads: this.threads.filter(thread => !removed.has(getThreadId(thread))),
      ...(threadIds && threadIds.includes(this.selectedId) ? { selectedThreadId: undefined } : {}),
    });
  }

  _onAllThreadsDeleted() {
    this._patchValue({ threads: [], selectedThreadId: undefined });
  }

  // called by the conversation subworkflow //
  // a new thread is started in the conversation panel: list its placeholder
  // as the selected item (its fresh timestamp sorts it to the top). The
  // record has no thread id yet, so it is selected by its placeholder id
  _onConversationNew(thread) {
    this._patchValue({
      threads: [...this.threads, thread],
      selectedThreadId: getPlaceholderId(thread),
    });
  }

  // the new thread is created server-side: the thread id is the only thing
  // the resolution gains — settle the listed placeholder item around it
  _onConversationResolve(placeholderId, threadId) {
    if (!this.get(placeholderId)) {
      return; // already settled (announced from both the live and the expired path)
    }
    this._patchValue({
      threads: this.threads.map(thread =>
        getPlaceholderId(thread) === placeholderId ? settlePlaceholder(thread, threadId) : thread),
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
    // carries its selection state, so views render it right off the data
    value.threads = sortThreadsByLatest(value.threads).map(thread => ({
      ...thread,
      selected: (getThreadId(thread) || getPlaceholderId(thread)) === value.selectedThreadId,
    }));
    return { ...data, value };
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
  _destroy(options) {
    this._conversation && this._conversation.destroy(options);
    super._destroy(options);
  }

}
