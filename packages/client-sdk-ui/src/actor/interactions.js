import { asArray } from '@miso.ai/commons';
import * as fields from './fields.js';

export default class InteractionsActor {

  constructor(hub, { client, options }) {
    this._client = client;
    this._options = options;
    this._unsubscribes = [
      hub.on(fields.interaction(), payload => this._handle(payload)),
    ];
  }

  _handle(payload) {
    payload = asArray(payload);
    const { preprocess = [], handle } = this._options.resolved.interactions;
    for (const p of preprocess) {
      payload = payload.map(p);
    }
    // TODO: support filter?
    if (payload.length === 0) {
      return;
    }
    if (handle) {
      handle(payload);
    } else {
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
