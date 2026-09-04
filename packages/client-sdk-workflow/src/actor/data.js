import * as fields from './fields.js';
import { isCurrentSession } from './utils.js';

export default class DataActor {

  constructor(hub, { source, options, polling = true }) {
    this._hub = hub;
    this._source = source;
    this._options = options;
    this._pollingEnabled = polling;
    this._servingCount = 0;
    this._unsubscribes = [
      hub.on(fields.session(), session => this._handleSession(session)),
      hub.on(fields.request(), event => this._handleRequest(event)),
    ];
  }

  get active() {
    return this._options.resolved.api.actor !== false;
  }

  /**
   * Whether a request is being served right now: fetched, or its response
   * stream (e.g. a polling iterable) still being consumed. Lets a workflow
   * tell an ongoing poll from a settled one — the conversation's answers
   * polling issues one request only while none is running.
   */
  get polling() {
    return this._servingCount > 0;
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
    // protocol: inactive -> no reaction; a request whose api entry declares
    // actor: false is served by other means (e.g. the conversation's thread
    // request, served by the ThreadsModel)
    if (!this.active || event.actor === false) {
      return;
    }
    const { session, ...request } = event;

    this._servingCount++;
    try {
      const { signal } = this._ac || {};
      const options = { ...event.options, signal };
      const response = await this._source({ session, ...request, options });
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
            // A new session invalidates ongoing data fetch for the old session, terminating the loop
            if (!isCurrentSession(this._hub, session)) {
              this._emitExpiredResponse({ session, request, value });
              break;
            }
            this._emitResponse({ session, request, value });
          }
        }
      } else {
        this._emitResponseWithSessionCheck({ session, request, value: response });
      }
    } catch(error) {
      this._error(error);
      this._emitResponseWithSessionCheck({ session, request, error });
    } finally {
      this._servingCount--;
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
    // abort ongoing data fetch if any
    this._ac && this._ac.abort({
      type: 'data-actor-destroy',
      message: 'Data actor is destroyed.',
    });
    for (const unsubscribe of this._unsubscribes) {
      unsubscribe();
    }
    this._unsubscribes = [];
  }

}
