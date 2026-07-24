import Workflow from './base.js';
import { fields } from '../actor/index.js';
import { ROLE, BUS_EVENT } from '../constants.js';
import { mergeRolesOptions } from './options/index.js';
import { getThreadId, isThreadUnread, normalizeThreadsValue } from '../util/threads.js';

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
 * bus (see BUS_EVENT): a mutation method calls the API, then emits a fact
 * event on the bus; local data is patched in the bus event handler, so a
 * change is applied through the same code path whether it originated from
 * this workflow or from the conversation workflow.
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
    const bus = this._workflowEvents;
    this._unsubscribes = [
      ...this._unsubscribes,
      bus.on(BUS_EVENT.THREAD_LOADED, event => this._onBusThreadLoaded(event)),
      bus.on(BUS_EVENT.THREAD_UPDATED, event => this._onBusThreadUpdated(event)),
      bus.on(BUS_EVENT.THREAD_DELETED, event => this._onBusThreadDeleted(event)),
      this._views.on(ROLE.THREADS, 'select', event => this._onViewThreadSelect(event)),
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
    this._workflowEvents.emit(BUS_EVENT.THREAD_SELECT, event);
    return this;
  }

  // mutations //
  async renameThread(threadId, title) {
    this._api.updateThread(threadId, { title }); // no await
    this._workflowEvents.emit(BUS_EVENT.THREAD_UPDATED, Object.freeze({ threadId, changes: { title } }));
  }

  async markThreadAsRead(threadId) {
    // TODO: should be in conversation workflow
    this._api.markThreadAsRead(threadId); // no await
    this._workflowEvents.emit(BUS_EVENT.THREAD_UPDATED, Object.freeze({ threadId, changes: { unread: false, read: true } }));
  }

  async deleteThread(threadId) {
    this._api.deleteThread(threadId); // no await
    this._workflowEvents.emit(BUS_EVENT.THREAD_DELETED, Object.freeze({ threadIds: [threadId] }));
  }

  async deleteThreads(threadIds) {
    this._api.deleteThreads({ thread_ids: threadIds }); // no await
    this._workflowEvents.emit(BUS_EVENT.THREAD_DELETED, Object.freeze({ threadIds }));
  }

  async deleteAllThreads() {
    this._api.deleteAllThreads(); // no await
    this._workflowEvents.emit(BUS_EVENT.THREAD_DELETED, Object.freeze({ all: true }));
  }

  get _api() {
    return this._client.api.ask.userHistory;
  }

  // view actions //
  _onViewThreadSelect({ value: thread }) {
    const threadId = getThreadId(thread);
    threadId && this.select(threadId);
  }

  // bus event handlers //
  _onBusThreadLoaded({ threadId }) {
    // opening a conversation marks it as read
    const thread = this.getThread(threadId);
    if (!thread || !isThreadUnread(thread)) {
      return;
    }
    this.markThreadAsRead(threadId).catch(error => this._error(error));
  }

  _onBusThreadUpdated({ threadId, changes }) {
    this._setThreads(this.threads.map(thread => getThreadId(thread) === threadId ? { ...thread, ...changes } : thread));
  }

  _onBusThreadDeleted({ threadIds, all }) {
    if (all || (threadIds && threadIds.includes(this._selectedThreadId))) {
      this._selectedThreadId = undefined; // clear before the data patch, so it's stamped along
    }
    if (all) {
      this._setThreads([]);
    } else {
      const removed = new Set(threadIds);
      this._setThreads(this.threads.filter(thread => !removed.has(getThreadId(thread))));
    }
  }

  // data //
  _defaultProcessData(data, oldData) {
    data = super._defaultProcessData(data, oldData);
    if (!data.value) {
      return data;
    }
    // the workflow property is authoritative for selection; every pass stamps
    // it into the value, so views render selection from data
    const value = { ...normalizeThreadsValue(data.value), selectedThreadId: this._selectedThreadId };
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
