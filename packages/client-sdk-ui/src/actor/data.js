import * as fields from './fields.js';
import { isCurrentSession } from './utils.js';

export default class DataActor {

  constructor(hub, { source, options, polling = true }) {
    this._hub = hub;
    this._source = source;
    this._options = options;
    this._polling = polling;
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
    // protocol: inactive -> no reaction
    if (!this.active) {
      return;
    }
    const { session, ...request } = event;

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
        if (this._polling) {
          let value;
          for await (value of response) {
            // A new session invalidates ongoing data fetch for the old session, terminating the loop
            if (!isCurrentSession(this._hub, session)) {
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
