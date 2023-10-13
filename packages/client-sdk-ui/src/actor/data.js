import * as fields from './fields.js';

export default class DataActor {

  constructor(hub, source, options) {
    this._hub = hub;
    this._source = source;
    this._options = options;
    this._unsubscribes = [
      hub.on(fields.session(), session => this._handleSession(session)),
      hub.on(fields.request(), event => this._handleRequest(event)),
    ];
  }

  get active() {
    return this._options.api.actor !== false;
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
    try {
      const { signal } = this._ac || {};
      const options = { ...event.options, signal };
      const response = await this._source({ session, ...event, options });
      // takes an iterable, either sync or async
      if (response && response[Symbol.asyncIterator]) {
        let value;
        for await (value of response) {
          // A new session invalidates ongoing data fetch for the old session, terminating the loop
          if (!this._isCurrentSession(session)) {
            break;
          }
          this._emitResponse({ session, value });
        }
      } else {
        this._emitResponseWithSessionCheck({ session, value: response });
      }
    } catch(error) {
      this._error(error);
      this._emitResponseWithSessionCheck({ session, error });
    }
  }

  _emitResponseWithSessionCheck(response) {
    // A new session invalidates ongoing data fetch
    this._isCurrentSession(response.session) && this._emitResponse(response);
  }

  _isCurrentSession(session) {
    if (!session) {
      return false;
    }
    const { session: currentSession } = this._hub.states;
    return currentSession && currentSession.index === session.index;
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
