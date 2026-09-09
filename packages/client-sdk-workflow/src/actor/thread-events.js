/**
 * The thread events channel: a minimal emitter shared by the chat-history
 * panels' data actors — subscribe() takes every fact, emit() delivers one
 * to all subscribers. It carries thread operation facts only.
 *
 * An operation is optimistic and fully described by its request (see
 * workflow/thread-operations.js): the initiating panel fires it on its own
 * hub, and the data actor serves the API call through the shared data
 * source. The request also carries its `fact`, which the data actor
 * publishes on this channel (the panels' data actors share one instance,
 * configured via extraOptions); every subscribed actor triggers it on its
 * own hub's `thread` field. Each panel handles the fact off its own hub
 * like any other hub event (`event`: `updated`, `deleted`, `all-deleted` →
 * _onThreadUpdated, ...) and applies it to its own data downstream — so a
 * change goes through the same code path whichever side it originated
 * from, and every endpoint call is triggered by a request event.
 */
export default class ThreadEvents {

  constructor() {
    this._subscribers = new Set();
  }

  subscribe(callback) {
    this._subscribers.add(callback);
    return () => this._subscribers.delete(callback);
  }

  emit(fact) {
    for (const callback of [...this._subscribers]) {
      callback(fact);
    }
  }

}
