import { mixinReadinessInstance, mixinReadinessPrototype } from '@miso.ai/commons';
import getRoot from '../root';
import { getApiGroup, getBasePayload } from '../api';

export default class DataSource {

  constructor({ client, api, payload, autoClient } = {}) {
    this._root = getRoot();
  
    this._setupApiName(api);
  
    if (payload !== undefined && typeof payload !== 'object') {
      throw new Error(`Default API payload must be an object: ${payload}`);
    }
    this._defaultPayload = payload || {};
  
    if (client) {
      // TODO: better validation
      this.client = client;
    }
    if (!client && autoClient) {
      // get or wait for the first Miso client
      (async () => {
        const { data: client } = await this._root.once('client');
        if (!this.client) {
          // skip if the client has been set while waiting
          this.client = client;
        }
      })();
    }

    mixinReadinessInstance(this);
  }

  get client() {
    return this._client;
  }

  get apiName() {
    return this._apiName;
  }

  get defaultPayload() {
    return this._defaultPayload;
  }

  set client(client) {
    if (this._client) {
      throw new Error(`Client has already been set.`);
    }
    if (!client) {
      throw new Error(`Cannot set client to null or undefined.`);
    }
    this._client = client;
    this._setReady();
  }

  async fetch({ payload }) {
    const apiName = this._apiName;
    if (apiName === 'custom') {
      throw new Error(`Custom fetch function is required for models with "custom" api.`);
    }
    payload = { ...getBasePayload(apiName), ...this._defaultPayload, ...payload };
    if (!this.ready) {
      await this.whenReady();
    }
    return this.client.api[this._apiGroup]._run(apiName, payload);
  }

  _setupApiName(apiName) {
    if (!apiName) {
      throw new Error(`API name cannot be empty.`);
    }
    this._apiName = apiName;
    this._apiGroup = getApiGroup(apiName);
  }

}

mixinReadinessPrototype(DataSource.prototype);
