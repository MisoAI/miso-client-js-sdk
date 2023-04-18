import { asArray } from '@miso.ai/commons';
import * as fields from './fields';

export default class InteractionsActor {

  constructor(hub, client, options = {}) {
    this._client = client;
    this.config(options);
    this._unsubscribes = [
      hub.on(fields.interaction(), payload => this._send(payload)),
    ];
  }

  config(options = {}) {
    if (options.preprocess && typeof options.preprocess !== 'function') {
      throw new Error('preprocess must be a function');
    }
    this._options = options;
  }

  _send(payload) {
    payload = asArray(payload);
    const { preprocess } = this._options;
    if (preprocess) {
      payload = payload.map(preprocess);
    }
    if (payload.length > 0) {
      this._client.api.interactions.upload(payload, { merge: true });
    }
  }

  destroy() {
    for (const unsubscribe of this._unsubscribes) {
      unsubscribe();
    }
    this._unsubscribes = [];
  }

}
