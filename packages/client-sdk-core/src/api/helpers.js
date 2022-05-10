import { Bulk } from '@miso.ai/commons';
import { API } from '../constants';

export default class ApiHelpers {

  constructor(client, root) {
    this._client = client;
    this._root = root;
    this._bulk = new Bulk(this._runBulkFetch.bind(this), client._error.bind(client));
  }

  assertReady() {
  }

  async fetch(url, payload, {
    method = 'POST',
    timeout,
  } = {}) {
    // TODO: organize arguments
    const body = JSON.stringify(payload);

    const controller = timeout && new AbortController();
    const signal = controller && controller.signal;
    const timeoutId = controller && setTimeout(() => controller.abort(), timeout);

    const res = await window.fetch(url, {
      method,
      body,
      cache: 'no-cache',
      mode: 'cors',
      signal,
    });

    timeoutId && clearTimeout(timeoutId);

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
    const url = this.url('bulk');
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

  url(...paths) {
    const { apiKey } = this._client.options;
    const apiName = paths.filter(s => s).join('/');
    // TODO: neutralize use of DOM API
    return `${this.apiBaseUrl}/${apiName}?api_key=${window.encodeURIComponent(apiKey)}`;
  }

  get apiBaseUrl() {
    // TODO: we may implement mock feature as a plugin
    const { apiHost = 'prod' } = this._client.options;
    switch (apiHost) {
      case 'prod':
        return API.BASE_URL;
      case 'mock':
        return API.MOCK_SERVER_URL;
      default:
        // TODO: normailize URL
        return apiHost;
    }
  }

  applyPayloadPasses(component, apiGroup, apiName, payload) {
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
