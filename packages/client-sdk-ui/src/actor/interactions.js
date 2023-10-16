import { asArray } from '@miso.ai/commons';
import * as fields from './fields.js';

export default class InteractionsActor {

  constructor(hub, { client, options = {} }) {
    this._client = client;
    this.config(options);
    this._unsubscribes = [
      hub.on(fields.interaction(), payload => this._handle(payload)),
    ];
  }

  config(options = {}) {
    if (options === false) {
      options = { handle: () => {} };
    }
    if (typeof options !== 'object') {
      throw new Error(`options must be an object: ${options}`);
    }
    if (options.preprocess && typeof options.preprocess !== 'function') {
      throw new Error('preprocess must be a function');
    }
    this._options = options;
  }

  _handle(payload) {
    payload = asArray(payload);
    const { preprocess, handle } = this._options;
    if (preprocess) {
      payload = payload.map(preprocess);
    }
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
