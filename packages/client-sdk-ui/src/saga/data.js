import * as fields from './fields';

export default class DataSupplier {

  constructor(saga) {
    this._saga = saga;
    this._unsubscribes = [
      saga.on(fields.session(), session => this._handleSession(session)),
      saga.on(fields.input(), event => this._handleInput(event)),
    ];
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

  _handleSession(session) {
    // protocol: no source, no reaction
    if (!this._source) {
      return;
    }
    // TODO: abort ongoing data fetch if any

    // reflect session update
    this._emitData({ session });
  }

  async _handleInput(event) {
    // protocol: no source, no reaction
    if (!this._source) {
      return;
    }
    const { session } = this._saga.states;
    try {
      // TODO: abort signal
      const value = await this._source({ session, ...event }, {});
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
        this._emitData({ session, value });
      } else {
        this._emitDataWithSessionCheck({ session, value });
      }
    } catch(error) {
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
    const { session: currentSession } = this._saga.states;
    return currentSession && currentSession.index === session.index;
  }

  _emitData(data) {
    this._saga.update(fields.data(), data);
  }

  destroy() {
    for (const unsubscribe of this._unsubscribes) {
      unsubscribe();
    }
    this._unsubscribes = [];
  }

}
