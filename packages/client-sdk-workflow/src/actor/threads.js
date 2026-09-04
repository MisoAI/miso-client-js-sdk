import { asArray, EventEmitter } from '@miso.ai/commons';
import { fallbackThreadFields } from '../source.js';

/**
 * The shared model of thread operations, one per client, shared by the two
 * chat-history workflows (History, Conversation), which are created
 * independently — either existing without the other. A mutation calls the
 * user history API, then emits the fact (`updated`, `deleted`,
 * `all-deleted`); each workflow subscribes and applies the fact to its own
 * data downstream (_onThreadUpdated, ...), so a change goes through the same
 * code path whichever side it originated from.
 */
export default class ThreadsModel {

  constructor(client) {
    this._client = client;
    this._events = new EventEmitter();
  }

  get _api() {
    return this._client.api.ask.userHistory;
  }

  on(name, callback) {
    return this._events.on(name, callback);
  }

  // reads //
  /**
   * The thread detail: the thread record — carrying the same properties as
   * the thread list API — and its turns. Serves the conversation workflow's
   * head request in place of its data actor.
   */
  async getThread(threadId) {
    // fill the canonical thread fields, as the api boundary does
    return fallbackThreadFields(await this._api.getThread(threadId));
  }

  // mutations //
  rename(threadId, title) {
    this._api.updateThread(threadId, { title }); // no await
    this._emitUpdated(threadId, { title });
  }

  markAsRead(threadId) {
    this._api.markThreadAsRead(threadId); // no await
    this._emitUpdated(threadId, { has_new: false });
  }

  /**
   * Subscribe the thread to answer updates.
   */
  subscribe(threadId) {
    this._api.subscribeThread(threadId); // no await
    this._emitUpdated(threadId, { subscribed: true });
  }

  /**
   * Withdraw the thread from answer updates. The unread fact (has_new) is
   * untouched — subscribed and has_new are independent, and the unread
   * presentation (isThreadUnread) derives from both, so the red dot hides
   * all the same.
   */
  unsubscribe(threadId) {
    this._api.unsubscribeThread(threadId); // no await
    this._emitUpdated(threadId, { subscribed: false });
  }

  /**
   * Delete one or more threads: takes a thread id or an array of them.
   */
  delete(threadIds) {
    threadIds = asArray(threadIds);
    if (!threadIds.length) {
      return;
    }
    this._api.deleteThreads({ thread_ids: threadIds }); // no await
    this._events.emit('deleted', Object.freeze({ threadIds }));
  }

  deleteAll() {
    this._api.deleteAllThreads(); // no await
    this._events.emit('all-deleted', Object.freeze({}));
  }

  _emitUpdated(threadId, changes) {
    this._events.emit('updated', Object.freeze({ threadId, changes: Object.freeze(changes) }));
  }

}
