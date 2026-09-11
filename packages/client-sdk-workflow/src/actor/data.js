import * as fields from './fields.js';
import { isCurrentSession } from './utils.js';

export default class DataActor {

  // `active: false` turns the actor off at construction: an item
  // subworkflow fed by its superworkflow makes no requests of its own — an
  // instance property, since the item shares its options object with the
  // parent
  constructor(hub, { source, options, polling = true, active = true, threadEvents }) {
    this._hub = hub;
    this._source = source;
    this._options = options;
    this._pollingEnabled = polling;
    this._active = active;
    this._threadEvents = threadEvents;
    this._serving = new Set();
    this._unsubscribes = [
      hub.on(fields.session(), session => this._handleSession(session)),
      hub.on(fields.request(), event => this._handleRequest(event)),
    ];
    if (threadEvents) {
      // the shared thread events channel: facts published by any actor on
      // the channel (this actor's own included) are triggered on this
      // actor's own hub `thread` field
      this._unsubscribes.push(threadEvents.subscribe(fact => this._hub.trigger(fields.thread(), fact)));
    }
  }

  get active() {
    return this._active && this._options.resolved.api.actor !== false;
  }

  /**
   * Whether a request matching the predicate is being served right now:
   * fetched, or its response stream (e.g. a polling iterable) still being
   * consumed. The predicate receives the request event; e.g. the
   * conversation asks about its own session's answers requests, to issue
   * one poll only while none is running.
   */
  isServing(predicate) {
    for (const request of this._serving) {
      if (predicate(request)) {
        return true;
      }
    }
    return false;
  }

  get source() {
    return this._source;
  }

  _handleSession(session) {
    // this is mandatory in any case
    /*
    if (!this.active) {
      return;
    }
    */
    // abort ongoing data fetch if any
    if (!this._session || (session.index !== this._session.index)) {
      // new session, abort preview data fetch if necessary
      this._ac && this._ac.abort({
        type: 'new-session',
        message: 'A new session is created, discarding the old one.',
      });
      this._ac = new AbortController();
    }
    this._session = session;
  }

  async _handleRequest(event) {
    // inactive -> no reaction: the workflow makes no requests of its own
    // (the construction-time active flag, or useApi(false) -> actor: false)
    if (!this.active) {
      return;
    }
    // a thread operation request carries its fact: published on the shared
    // thread events channel, reaching both chat-history panels' hubs
    if (event.fact && this._threadEvents) {
      this._threadEvents.emit(event.fact);
    }
    const { session, ...request } = event;

    this._serving.add(event);
    try {
      const { signal } = this._ac || {};
      const options = { ...event.options, signal };
      const response = await this._source({ session, ...request, options });
      // the actor died while the fetch was out: the response — settled, not
      // aborted — is announced on the expired-response salvage channel (the
      // workflow's hub outlives it), and any stream is dropped unconsumed
      if (this._destroyed) {
        const value = response && response[Symbol.asyncIterator] ? response._response : response;
        if (value !== undefined) {
          this._emitExpiredResponse({ session, request, value });
        }
        this._abort();
        return;
      }
      // takes an iterable, either sync or async
      if (response && response[Symbol.asyncIterator]) {
        // also emit reponse of the head request, if available
        if (response._response) {
          this._emitResponseWithSessionCheck({ session, request, value: response._response });
        }
        if (this._pollingEnabled) {
          let value;
          for await (value of response) {
            if (value === undefined) {
              continue; // e.g. a polling stream ending with nothing left to fetch
            }
            // destruction or a new session invalidates the ongoing fetch,
            // terminating the loop
            if (this._destroyed || !isCurrentSession(this._hub, session)) {
              this._emitExpiredResponse({ session, request, value });
              this._destroyed && this._abort();
              break;
            }
            this._emitResponse({ session, request, value });
          }
        }
      } else {
        this._emitResponseWithSessionCheck({ session, request, value: response });
      }
    } catch(error) {
      if (this._destroyed) {
        return; // e.g. the deferred abort settling the fetch's rejection
      }
      this._error(error);
      this._emitResponseWithSessionCheck({ session, request, error });
    } finally {
      this._serving.delete(event);
    }
  }

  _emitResponseWithSessionCheck(response) {
    // A new session invalidates ongoing data fetch
    if (isCurrentSession(this._hub, response.session)) {
      this._emitResponse(response);
    } else {
      this._emitExpiredResponse(response);
    }
  }

  _emitResponse(response) {
    this._hub.update(fields.response(), response);
  }

  // an expired response never enters the data flow, but it is announced (as
  // a trigger, not persisted) for the workflow to salvage what it can — e.g.
  // the id of a thread whose creating session was switched away from
  _emitExpiredResponse(response) {
    this._hub.trigger(fields.expiredResponse(), response);
  }

  _error(error) {
    // TODO
    console.error(error);
  }

  _destroy() {
    this._destroyed = true;
    // an in-flight serving is not aborted outright: its pending fetch
    // settles first and lands on the expired-response salvage channel —
    // e.g. the id of a thread whose creating workflow was destroyed — then
    // the serving aborts itself (see _handleRequest); with nothing in
    // flight, abort right away
    if (this._serving.size === 0) {
      this._abort();
    }
    for (const unsubscribe of this._unsubscribes) {
      unsubscribe();
    }
    this._unsubscribes = [];
  }

  _abort() {
    this._ac && this._ac.abort({
      type: 'data-actor-destroy',
      message: 'Data actor is destroyed.',
    });
  }

}
