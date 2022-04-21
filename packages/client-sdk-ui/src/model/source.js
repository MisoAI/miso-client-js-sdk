import { mixinReadinessInstance, mixinReadinessPrototype } from '@miso.ai/commons';
import getRoot from '../root';
import { getApiGroup, getBasePayload, transformResponse } from '../api';

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

  async fetch(payload) {
    payload = { ...getBasePayload(this._apiName), ...this._defaultPayload, ...payload };
    if (!this.ready) {
      await this.whenReady();
    }
    const response = await this.client.api[this._apiGroup]._run(this._apiName, payload);
    return transformResponse(this._apiName, response);
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
