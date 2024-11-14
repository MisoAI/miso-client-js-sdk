import * as fields from './fields.js';
import { isCurrentSession } from './utils.js';

export default class DataActor {

  constructor(hub, { source, options, ...extra }) {
    this._hub = hub;
    this._source = source;
    this._options = options;
    this._extra = extra;
    this._unsubscribes = [
      hub.on(fields.session(), session => this._handleSession(session)),
      hub.on(fields.request(), event => this._handleRequest(event)),
    ];
  }

  get active() {
    return this._options.resolved.api.actor !== false;
  }

  get source() {
    return this._source;
  }

  _handleSession(session) {
    // protocol: inactive -> no reaction
    if (!this.active) {
      return;
    }

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

    // reflect session update
    this._emitResponse({ session });
  }

  async _handleRequest(event) {
    // protocol: inactive -> no reaction
    if (!this.active) {
      return;
    }
    const { session } = this._hub.states;
    const { session: _, ...request } = event;

    // emit response to update request
    this._emitResponse({ session, request });

    try {
      const { signal } = this._ac || {};
      const options = { ...event.options, signal };
      const response = await this._source({ session, ...event, options });
      // takes an iterable, either sync or async
      if (response && response[Symbol.asyncIterator]) {
        const { onResponseObject } = this._extra;
        if (typeof onResponseObject === 'function') {
          try {
            onResponseObject({ session, request, value: response });
          } catch(error) {
            this._error(error);
          }
        }
        let value;
        for await (value of response) {
          // A new session invalidates ongoing data fetch for the old session, terminating the loop
          if (!isCurrentSession(this._hub, session)) {
            break;
          }
          this._emitResponse({ session, request, value });
        }
      } else {
        this._emitResponseWithSessionCheck({ session, request, value: response });
      }
    } catch(error) {
      this._error(error);
      this._emitResponseWithSessionCheck({ session, request, error });
    }
  }

  _emitResponseWithSessionCheck(response) {
    // A new session invalidates ongoing data fetch
    isCurrentSession(this._hub, response.session) && this._emitResponse(response);
  }

  _emitResponse(response) {
    this._hub.update(fields.response(), response);
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
