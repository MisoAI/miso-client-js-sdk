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
    // TODO: omit when option == false
    payload = asArray(payload);

    if (payload.length === 0) {
      return;
    }

    this._client.api.interactions.upload(payload, { merge: true });
  }

  destroy() {
    for (const unsubscribe of this._unsubscribes) {
      unsubscribe();
    }
    this._unsubscribes = [];
  }

}
