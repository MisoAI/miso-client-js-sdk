import { Bulk, trimObj } from '@miso.ai/commons';
import { API } from '../constants.js';

export default class ApiHelpers {

  constructor(client, root) {
    this._client = client;
    this._root = root;
    this._bulk = new Bulk(this._runBulkFetch.bind(this), client._error.bind(client));
  }

  async fetch(url, payload, {
    method = 'POST',
    headers,
    timeout,
    sendApiKeyByHeader,
  } = {}) {
    const { apiKey, request = {} } = this._client.options;
    timeout = timeout || request.timeout;
    sendApiKeyByHeader = sendApiKeyByHeader || request.sendApiKeyByHeader;

    if (sendApiKeyByHeader) {
      headers = { ...headers, 'X-API-KEY': apiKey };
    }
    // TODO: external abort signal
    // TODO: organize arguments
    const body = method !== 'GET' && payload != undefined ? JSON.stringify(payload) : undefined;

    const signal = timeout ? AbortSignal.timeout(timeout) : undefined;

    const res = await (this._root._customFetch || window.fetch)(url, trimObj({
      method,
      headers,
      body,
      cache: 'no-cache',
      mode: 'cors',
      signal,
    }));

    const resBody = await res.json();
    if (res.status >= 400 || resBody.errors) {
      var err = new Error(resBody.message);
      err.data = resBody;
      err.status = res.status;
      throw err;
    }
    return resBody;
  }

  get bulkInfo() {
    return this._bulk.info;
  }

  async fetchForBulk(apiGroup, apiName, payload, { method } = {}) {
    if (method && method !== 'POST') {
      throw new Error(`Non-POST API is not supported in bulk mode: ${url}`);
    }
    return this._bulk.run({ apiGroup, apiName, payload });
  }

  async _runBulkFetch(requests) {
    // TODO: request options?
    const url = this.url(['bulk']);
    const payload = {
      requests: requests.map(({ action: { apiGroup, apiName, payload } }) => ({
        api_name: `${apiGroup}/${apiName}`,
        body: payload,
      })),
    };
    const { data: responses } = await this.fetch(url, payload);
    for (let i = 0, len = requests.length; i < len; i++) {
      const { resolution } = requests[i];
      const { error, status_code, body } = responses[i];
      if (status_code >= 400 || error) {
        resolution.reject({ status_code, body });
      } else {
        resolution.resolve(body);
      }
    }
  }

  sendBeacon(url, payload, { method } = {}) {
    if (method && method !== 'POST') {
      throw new Error(`Non-POST API is not supported in useBeacon mode: ${url}`);
    }
    if (!window.navigator.sendBeacon(url, JSON.stringify(payload))) {
      throw new Error(`Send beacon unsuccessful: ${url}`);
    }
  }

  url(paths, options = {}) {
    const { apiKey, request = {} } = this._client.options;
    const sendApiKeyByHeader = options.sendApiKeyByHeader || request.sendApiKeyByHeader;
    const apiName = paths.filter(s => s).join('/');
    const url = `${this.getApiEndpoint(apiName)}/${apiName}`;
    return sendApiKeyByHeader ? url : `${url}?api_key=${window.encodeURIComponent(apiKey)}`;
  }

  getApiEndpoint(apiName) {
    const {
      dataEndpoint = API.DATA_ENDPOINT,
      eventEndpoint = API.EVENT_ENDPOINT,
    } = this._client.options;
    return apiName === 'interactions' ? eventEndpoint : dataEndpoint;
  }

  applyUrlPasses(component, { apiGroup, apiName, url }) {
    const client = this._client;
    for (const pass of this._root._urlPasses) {
      try {
        url = pass({ client, apiGroup, apiName, url }) || url;
      } catch(e) {
        component.error(e);
      }
    }
    return url;
  }

  applyPayloadPasses(component, { apiGroup, apiName, payload }) {
    const client = this._client;
    for (const pass of this._root._payloadPasses) {
      try {
        payload = pass({ client, apiGroup, apiName, payload }) || payload;
      } catch(e) {
        component.error(e);
      }
    }
    return payload;
  }

}
