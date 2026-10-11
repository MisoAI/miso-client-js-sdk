import { API, asArray, mixin, lowerCamelToSnake, trimObj } from '@miso.ai/commons';
import { fields } from '../actor/index.js';
import { REQUEST_TYPE } from '../constants.js';
import { undoThreadOperation } from '../util/threads.js';

/**
 * The id-based thread operations of the chat-history workflows. Each method
 * describes its operation — `{ type, ... }`: the type is the method's own
 * name, the rest its arguments (the thread id(s), the new title) — builds
 * its request payload, and issues the two (_applyThreadOperation). What an
 * operation does to a thread record is the panels' reading of its type
 * (getThreadChanges).
 *
 * The request fires on the workflow's own hub as a `threads`-typed request
 * named after the operation (the snake case of its type): fire-and-forget,
 * with no loading commit and no api option merging. The response carries
 * no data — each workflow's own _onResponse override knows to skip
 * `threads`-typed responses (its response handling is its own; a mixin
 * cannot know what else there is to cover).
 *
 * An operation is optimistic: riding its request, it is published on the
 * thread events channel and applied by the panels right away. If the
 * request fails, an `error` event naming the operation follows on the same
 * channel, and the panels take it back. The rollback is deliberately
 * modest — operations depend on one another, so no rule set gets it
 * perfect: an operation carries what its own undo needs (a rename its
 * `oldTitle`), and only rename and the subscription toggles are undone
 * (getThreadUndoChanges). Nothing presents the failure to the user yet.
 *
 * History mixes the methods in with mixinThreadOperations() — methods the
 * class defines itself win, so it specializes rename/delete with a
 * placeholder guard, calling back into the prototype methods here.
 * Conversation mixes in the support methods only
 * (mixinThreadOperationSupport): it exposes the operations against the
 * thread on display, each calling the prototype method here with its own
 * thread id passed in.
 */
export function mixinThreadOperations(prototype) {
  mixin(prototype, ThreadOperations.prototype);
  mixinThreadOperationSupport(prototype);
}

export function mixinThreadOperationSupport(prototype) {
  mixin(prototype, ThreadOperationSupport.prototype);
}

export class ThreadOperations {

  // the title being replaced rides along, so the operation can be taken
  // back if it fails
  rename(threadId, title, oldTitle) {
    this._applyThreadOperation({ type: 'rename', threadId, title, oldTitle });
  }

  markAsRead(threadId) {
    this._applyThreadOperation({ type: 'markAsRead', threadId });
  }

  /**
   * Subscribe the thread to answer updates.
   */
  subscribe(threadId) {
    this._applyThreadOperation({ type: 'subscribe', threadId });
  }

  /**
   * Withdraw the thread from answer updates. The unread fact (has_new) is
   * untouched — subscribed and has_new are independent, and the unread
   * presentation (isThreadUnread) derives from both, so the red dot hides
   * all the same.
   */
  unsubscribe(threadId) {
    this._applyThreadOperation({ type: 'unsubscribe', threadId });
  }

  /**
   * Delete one or more threads: takes a thread id or an array of them.
   */
  delete(threadIds) {
    threadIds = Object.freeze(asArray(threadIds));
    this._applyThreadOperation({ type: 'delete', threadIds });
  }

  deleteAll() {
    this._applyThreadOperation({ type: 'deleteAll' });
  }

}

/**
 * What a workflow needs to issue thread operations and to take part in
 * their rollback.
 */
export class ThreadOperationSupport {

  _applyThreadOperation(operation) {
    Object.freeze(operation); // shared across both panels from here on
    // fire the operation on the workflow's own hub: a request event only —
    // no loading commit, no api option merging; the response carries no data
    // (_onResponse), the operation rides the request
    const payload = toPayload(operation);
    this._hub.update(fields.request(), {
      ...threadRequest(lowerCamelToSnake(operation.type), payload),
      operation,
      type: REQUEST_TYPE.THREADS,
      session: this.session,
    });
  }

  // an operation failed: take it back here — the operation itself says
  // how (undoThreadOperation), applied through the workflow's own
  // _patchThread
  _onThreadOperationError({ operation }) {
    this._patchThread(operation.threadId, thread => undoThreadOperation(thread, operation));
  }

}

/**
 * The thread detail read, in the same request scheme as the operations: a
 * simple name on the `threads` group, the thread id in the payload,
 * interpreted by the data source. It serves as the conversation panel's
 * head request, its identity spelled out at the call site — a fixed
 * endpoint, not an api option. (The list read is the history workflow's
 * api option instead: same fixed endpoint, but its paging window — and
 * filters, later — ride the payload, so it is configurable.) The payload
 * carries the message paging window (order, rows, after).
 */
export function getThreadRequest(threadId, payload) {
  return threadRequest('get', { thread_id: threadId, ...payload });
}

function threadRequest(name, payload) {
  return { group: API.GROUP.THREADS, name, payload };
}

// the request payload of an operation: its arguments in the API's naming —
// the type is the request's name, and what serves the undo stays local
function toPayload({ type: _type, oldTitle: _oldTitle, threadId: thread_id, threadIds: thread_ids, ...props }) {
  return trimObj({
    thread_id,
    thread_ids,
    ...props,
  });
}
