import { API, asArray, mixin } from '@miso.ai/commons';
import { fields } from '../actor/index.js';
import { REQUEST_TYPE } from '../constants.js';

/**
 * The id-based thread operations of the chat-history workflows: each builds
 * its request — a simple name on the `threads` group, the thread id in the
 * payload, paired with the fact it establishes — and fires it on the
 * workflow's own hub as a `threads`-typed request: fire-and-forget, with no
 * loading commit and no api option merging. The response carries no data —
 * each workflow's own _onResponse override knows to skip `threads`-typed
 * responses (its response handling is its own; a mixin cannot know what
 * else there is to cover).
 *
 * History mixes the methods in with makeThreadOperations() — methods the
 * class defines itself win, so it specializes rename/delete with a
 * placeholder guard, calling back into the prototype methods here.
 * Conversation does not mix them in: it exposes the operations against the
 * thread on display, each calling the prototype method with its own thread
 * id passed in — supplying _requestForThreadOperation by delegation,
 * since the operation methods fire through it.
 */
export function mixinThreadOperations(prototype) {
  mixin(prototype, ThreadOperations.prototype);
}

export class ThreadOperations {

  rename(threadId, title) {
    this._requestForThreadOperation(threadRequest('update', { thread_id: threadId, title }, updated(threadId, { title })));
  }

  markAsRead(threadId) {
    this._requestForThreadOperation(threadRequest('mark_as_read', { thread_id: threadId }, updated(threadId, { has_new: false })));
  }

  /**
   * Subscribe the thread to answer updates.
   */
  subscribe(threadId) {
    this._requestForThreadOperation(threadRequest('subscribe', { thread_id: threadId }, updated(threadId, { subscribed: true })));
  }

  /**
   * Withdraw the thread from answer updates. The unread fact (has_new) is
   * untouched — subscribed and has_new are independent, and the unread
   * presentation (isThreadUnread) derives from both, so the red dot hides
   * all the same.
   */
  unsubscribe(threadId) {
    this._requestForThreadOperation(threadRequest('unsubscribe', { thread_id: threadId }, updated(threadId, { subscribed: false })));
  }

  /**
   * Delete one or more threads: takes a thread id or an array of them.
   */
  delete(threadIds) {
    threadIds = Object.freeze(asArray(threadIds));
    this._requestForThreadOperation(threadRequest('delete', { thread_ids: threadIds }, Object.freeze({ event: 'deleted', threadIds })));
  }

  deleteAll() {
    this._requestForThreadOperation(threadRequest('delete_all', undefined, Object.freeze({ event: 'all-deleted' })));
  }

  // fire the operation on the workflow's own hub: a request event only —
  // no loading commit, no api option merging; the response carries no data
  // (_onResponse), the fact rides the request
  _requestForThreadOperation(request) {
    this._hub.update(fields.request(), { ...request, type: REQUEST_TYPE.THREADS, session: this.session });
  }

}

/**
 * The thread reads, in the same request scheme as the operations: a simple
 * name on the `threads` group, interpreted by the data source. The detail
 * read (the thread id in the payload) serves as the conversation panel's
 * head request, the list read as the history workflow's; both spell their
 * identity out at the call site — fixed endpoints, not api options.
 */
export function getThreadRequest(threadId) {
  return threadRequest('get', { thread_id: threadId });
}

export function getThreadListRequest() {
  return threadRequest('list');
}

function threadRequest(name, payload, fact) {
  return { group: API.GROUP.THREADS, name, payload, fact };
}

function updated(threadId, changes) {
  return Object.freeze({ event: 'updated', threadId, changes: Object.freeze(changes) });
}
