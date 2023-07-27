import * as fields from './fields';

export default class DataActor {

  constructor(hub) {
    this._hub = hub;
    this._unsubscribes = [
      hub.on(fields.session(), session => this._handleSession(session)),
      hub.on(fields.input(), event => this._handleInput(event)),
    ];
    this._postProcess = v => v;
  }

  get source() {
    return this._source;
  }

  set source(source) {
    // accepts falsy values
    if (source && typeof source !== 'function') {
      throw new Error(`Expect source to be a function: ${source}`);
    }
    this._source = source;
  }

  set postProcess(fn) {
    if (fn && typeof fn !== 'function') {
      throw new Error(`Expect postProcess to be a function: ${fn}`);
    }
    this._postProcess = fn || (v => v);
  }

  _handleSession(session) {
    // protocol: no source, no reaction
    if (!this._source) {
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
    this._emitData({ session });
  }

  async _handleInput(event) {
    // protocol: no source, no reaction
    if (!this._source) {
      return;
    }
    const { session } = this._hub.states;
    try {
      const { signal } = this._ac || {};
      const options = { ...event.options, signal };
      const value = await this._source({ session, ...event, options });
      // takes either iterator or iterable, sync or async
      const iterator = value && (typeof value.next === 'function' ? value : value[Symbol.asyncIterator]);
      if (iterator) {
        let value;
        for await (value of iterator) {
          // A new session invalidates ongoing data fetch for the old session, terminating the loop
          if (!this._isCurrentSession(session)) {
            break;
          }
          this._emitData({ session, value, ongoing: true });
        }
        // TODO: find a way to emit the last value without the ongoing flag
        this._emitDataWithSessionCheck({ session, value });
      } else {
        this._emitDataWithSessionCheck({ session, value });
      }
    } catch(error) {
      this._error(error);
      this._emitDataWithSessionCheck({ session, error });
    }
  }

  _emitDataWithSessionCheck(data) {
    // A new session invalidates ongoing data fetch
    this._isCurrentSession(data.session) && this._emitData(data);
  }

  _isCurrentSession(session) {
    if (!session) {
      return false;
    }
    const { session: currentSession } = this._hub.states;
    return currentSession && currentSession.index === session.index;
  }

  _emitData(data) {
    this._hub.update(fields.data(), this._postProcess(data));
  }

  _error(error) {
    // TODO
    console.error(error);
  }

  destroy() {
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
