import Workflow from './base.js';
import { fields } from '../actor/index.js';
import { ROLE } from '../constants.js';
import { mergeRolesOptions } from './options/index.js';
import { getThreadId, isThreadUnread, normalizeThreadsValue, sortThreadsByLatest } from '../util/threads.js';

const ROLES_OPTIONS = mergeRolesOptions(Workflow.ROLES_OPTIONS, {
  main: ROLE.THREADS,
  members: [ROLE.THREADS],
  mappings: {
    // decorate each thread with its selection state, so the view renders
    // selection declaratively from data
    [ROLE.THREADS]: data => {
      const { threads, selectedThreadId } = (data.value || {});
      return threads && threads.map(thread => ({ ...thread, selected: getThreadId(thread) === selectedThreadId }));
    },
  },
});

/**
 * The thread-list panel of the chat history interface, backed by the user
 * history API. Loads the list of threads and manages thread-level operations
 * (select, rename, delete, mark as read).
 *
 * Mutations follow an event-sourced pattern on the per-client workflow event
 * bus (client.workflows.bus): a mutation method calls the API, then emits a
 * fact event on the bus; local data is patched in the default bus handler
 * (bus.handle), so a change is applied through the same code path whether it
 * originated from this workflow or elsewhere.
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
    this._started = false;
    this._selectedThreadId = undefined;
  }

  _initSubscriptions(args) {
    super._initSubscriptions(args);
    this._unsubscribes = [
      ...this._unsubscribes,
      this._bus.handle('conversation', 'load', event => this._onThreadLoaded(event)),
      this._bus.handle('conversation', 'new', event => this._onConversationNew(event)),
      this._bus.handle('conversation', 'resolve', event => this._onConversationResolve(event)),
      this._bus.handle('history', 'update', event => this._onThreadUpdated(event)),
      this._bus.handle('history', 'delete', event => this._onThreadDeleted(event)),
      this._bus.handle('history', 'delete-all', () => this._onAllThreadsDeleted()),
      this._views.on(ROLE.THREADS, 'select', event => this._onViewThreadSelect(event)),
      this._views.on(ROLE.THREADS, 'delete', event => this._onViewThreadDelete(event)),
      this._views.on(ROLE.THREADS, 'new', () => this.startNew()),
    ];
  }

  // properties //
  get threads() {
    const data = this._hub.states[fields.data()];
    return (data && data.value && data.value.threads) || [];
  }

  get selectedThreadId() {
    return this._selectedThreadId;
  }

  getThread(threadId) {
    return this.threads.find(thread => getThreadId(thread) === threadId);
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
   * Start a new chat: clear the selection and announce it on the event bus,
   * for the conversation workflow to enter new-thread mode.
   */
  startNew() {
    this._selectedThreadId = undefined;
    this._recommitData(); // the cleared selection is stamped into data
    this._emit('new', {});
    this._bus.emit('new');
    return this;
  }

  /**
   * Mark a thread as selected and announce it on the event bus, for the
   * conversation workflow to load it.
   */
  select(threadId) {
    if (!threadId) {
      throw new Error(`threadId is required in select() call`);
    }
    this._selectedThreadId = threadId;
    this._recommitData(); // selection is stamped into data, so views refresh
    const event = Object.freeze({ threadId, thread: this.getThread(threadId) });
    this._emit('select', event);
    this._bus.emit('select', event);
    return this;
  }

  // mutations //
  async renameThread(threadId, title) {
    this._api.updateThread(threadId, { title }); // no await
    const event = Object.freeze({ threadId, changes: { title } });
    this._bus.emit('update', event);
  }

  async markThreadAsRead(threadId) {
    // TODO: should be in conversation workflow
    this._api.markThreadAsRead(threadId); // no await
    const event = Object.freeze({ threadId, changes: { unread: false, read: true } });
    this._bus.emit('update', event);
  }

  async deleteThread(threadId) {
    this._api.deleteThread(threadId); // no await
    const event = Object.freeze({ threadIds: [threadId] });
    this._bus.emit('delete', event);
  }

  async deleteThreads(threadIds) {
    this._api.deleteThreads({ thread_ids: threadIds }); // no await
    const event = Object.freeze({ threadIds });
    this._bus.emit('delete', event);
  }

  async deleteAllThreads() {
    this._api.deleteAllThreads(); // no await
    this._bus.emit('delete-all');
  }

  get _api() {
    return this._client.api.ask.userHistory;
  }

  // view actions //
  _onViewThreadSelect({ value: thread }) {
    const threadId = getThreadId(thread);
    threadId && this.select(threadId);
  }

  _onViewThreadDelete({ value: thread }) {
    const threadId = getThreadId(thread);
    threadId && this.deleteThread(threadId);
  }

  // bus event handlers //
  _onThreadLoaded({ threadId }) {
    // opening a conversation marks it as read
    const thread = this.getThread(threadId);
    if (!thread || !isThreadUnread(thread)) {
      return;
    }
    this.markThreadAsRead(threadId).catch(error => this._error(error));
  }

  _onThreadUpdated({ threadId, changes }) {
    this._setThreads(this.threads.map(thread => getThreadId(thread) === threadId ? { ...thread, ...changes } : thread));
  }

  _onThreadDeleted({ threadIds }) {
    if (threadIds && threadIds.includes(this._selectedThreadId)) {
      this._selectedThreadId = undefined; // clear before the data patch, so it's stamped along
    }
    const removed = new Set(threadIds);
    this._setThreads(this.threads.filter(thread => !removed.has(getThreadId(thread))));
  }

  _onAllThreadsDeleted() {
    this._selectedThreadId = undefined;
    this._setThreads([]);
  }

  // a new thread is started in the conversation panel: list its placeholder
  // as the selected item (its fresh timestamp sorts it to the top)
  _onConversationNew({ threadId, thread }) {
    this._selectedThreadId = threadId;
    this._setThreads([...this.threads, thread]);
  }

  // the new thread is created server-side: replace the placeholder item
  _onConversationResolve({ placeholderId, thread }) {
    if (this._selectedThreadId === placeholderId) {
      this._selectedThreadId = getThreadId(thread);
    }
    this._setThreads(this.threads.map(t => getThreadId(t) === placeholderId ? thread : t));
  }

  // data //
  _defaultProcessData(data, oldData) {
    data = super._defaultProcessData(data, oldData);
    if (!data.value) {
      return data;
    }
    // the workflow property is authoritative for selection; every pass stamps
    // it into the value, so views render selection from data; threads are
    // canonically ordered by latest activity
    const value = { ...normalizeThreadsValue(data.value), selectedThreadId: this._selectedThreadId };
    value.threads = sortThreadsByLatest(value.threads);
    return { ...data, value };
  }

  _setThreads(threads) {
    const data = this._hub.states[fields.data()];
    if (!data || !data.value) {
      return; // the list is not loaded yet, nothing to patch
    }
    this.updateData({ ...data, value: { ...data.value, threads } });
  }

  // re-commit the current data through the pipeline, refreshing views
  _recommitData() {
    const data = this._hub.states[fields.data()];
    if (!data || !data.value) {
      return; // not loaded yet; selection is stamped when data arrives
    }
    this.updateData({ ...data });
  }

}
