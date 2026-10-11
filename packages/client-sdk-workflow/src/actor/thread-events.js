/**
 * The thread events channel: a minimal emitter shared by the chat-history
 * panels' data actors — subscribe() takes every event, emit() delivers one
 * to all subscribers. It carries thread operations, and the errors of
 * those that failed.
 *
 * An operation is optimistic (see workflow/thread-operations.js): the
 * initiating panel fires its request on its own hub, and the data actor
 * serves the API call through the shared data source. The request also
 * carries the `operation` — `{ type, ... }`, e.g. `{ type: 'rename',
 * threadId, title, oldTitle }` — which the data actor publishes on this channel
 * (the panels' data actors share one instance, configured via
 * extraOptions); every subscribed actor triggers it on its own hub's
 * `thread` field. Each panel handles it off its own hub like any other hub
 * event, by type (_onThreadUpdated, _onThreadDeleted, ...), and applies it
 * to its own data downstream — so a change goes through the same code path
 * whichever side it originated from, and every endpoint call is triggered
 * by a request event.
 *
 * If the API call fails, the data actor follows up with `{ type: 'error',
 * operation, error }` — the very operation object — and the panels undo
 * what the operation did to their data (_onThreadOperationError).
 */
export default class ThreadEvents {

  constructor() {
    this._subscribers = new Set();
  }

  subscribe(callback) {
    this._subscribers.add(callback);
    return () => this._subscribers.delete(callback);
  }

  emit(event) {
    for (const callback of [...this._subscribers]) {
      callback(event);
    }
  }

}
