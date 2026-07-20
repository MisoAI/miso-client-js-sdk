import Workflow from './base.js';
import { fields } from '../actor/index.js';
import { ROLE, BUS_EVENT } from '../constants.js';
import { mergeRolesOptions } from './options/index.js';
import { getThreadId, isThreadUnread, normalizeThreadsValue } from '../util/threads.js';

const ROLES_OPTIONS = mergeRolesOptions(Workflow.ROLES_OPTIONS, {
  main: ROLE.THREADS,
  members: [ROLE.THREADS],
  mappings: {
    [ROLE.THREADS]: data => data.value && data.value.threads,
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
 * this workflow or from the thread workflow.
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
    const events = this._workflowEvents;
    this._unsubscribes = [
      ...this._unsubscribes,
      events.on(BUS_EVENT.THREAD_LOADED, event => this._onThreadLoaded(event)),
      events.on(BUS_EVENT.THREAD_UPDATED, event => this._onThreadUpdated(event)),
      events.on(BUS_EVENT.THREAD_DELETED, event => this._onThreadDeleted(event)),
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
   * thread workflow to load the conversation.
   */
  select(threadId) {
    if (!threadId) {
      throw new Error(`threadId is required in select() call`);
    }
    this._selectedThreadId = threadId;
    const event = Object.freeze({ threadId, thread: this.getThread(threadId) });
    this._emit('select', event);
    this._workflowEvents.emit(BUS_EVENT.THREAD_SELECT, event);
    return this;
  }

  // mutations //
  async renameThread(threadId, title) {
    await this._api.updateThread(threadId, { title });
    this._workflowEvents.emit(BUS_EVENT.THREAD_UPDATED, Object.freeze({ threadId, changes: { title } }));
  }

  async markThreadAsRead(threadId) {
    await this._api.markThreadAsRead(threadId);
    this._workflowEvents.emit(BUS_EVENT.THREAD_UPDATED, Object.freeze({ threadId, changes: { unread: false, read: true } }));
  }

  async deleteThread(threadId) {
    await this._api.deleteThread(threadId);
    this._workflowEvents.emit(BUS_EVENT.THREAD_DELETED, Object.freeze({ threadIds: [threadId] }));
  }

  async deleteThreads(threadIds) {
    await this._api.deleteThreads({ thread_ids: threadIds });
    this._workflowEvents.emit(BUS_EVENT.THREAD_DELETED, Object.freeze({ threadIds }));
  }

  async deleteAllThreads() {
    await this._api.deleteAllThreads();
    this._workflowEvents.emit(BUS_EVENT.THREAD_DELETED, Object.freeze({ all: true }));
  }

  get _api() {
    return this._client.api.ask.userHistory;
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

  _onThreadDeleted({ threadIds, all }) {
    if (all) {
      this._setThreads([]);
    } else {
      const removed = new Set(threadIds);
      this._setThreads(this.threads.filter(thread => !removed.has(getThreadId(thread))));
    }
    if (all || (threadIds && threadIds.includes(this._selectedThreadId))) {
      this._selectedThreadId = undefined;
    }
  }

  // data //
  _defaultProcessData(data, oldData) {
    data = super._defaultProcessData(data, oldData);
    return data.value ? { ...data, value: normalizeThreadsValue(data.value) } : data;
  }

  _setThreads(threads) {
    const data = this._hub.states[fields.data()];
    if (!data || !data.value) {
      return; // the list is not loaded yet, nothing to patch
    }
    this.updateData({ ...data, value: { ...data.value, threads } });
  }

}
