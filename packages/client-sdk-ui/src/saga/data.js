import { trimObj } from '@miso.ai/commons';

export default class DataSupplier {

  constructor(saga) {
    this._saga = saga;
    this._unsubscribes = [
      saga.on('session', session => this._handleSession(session)),
      saga.on('input', event => this._handleInput(event)),
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
    if (!this._source) {
      return;
    }
    this._saga.update('data', trimObj({ session }));
  }

  async _handleInput(event) {
    if (!this._source) {
      return;
    }
    const { session } = this._saga.states;
    let value, error;
    try {
      // TODO: abort signal
      value = await this._source({ session, ...event }, {});
      this._emitData({ session, value });
    } catch(e) {
      error = e;
      this._emitData({ session, error });
    }
  }

  _emitData(data) {
    const { session: latestSession } = this._saga.states;
    const { session } = data;
    if (!latestSession || latestSession.index !== session.index) {
      return;
    }
    this._saga.update('data', data);
  }

  destroy() {
    for (const unsubscribe of this._unsubscribes) {
      unsubscribe();
    }
    this._unsubscribes = [];
  }

}
