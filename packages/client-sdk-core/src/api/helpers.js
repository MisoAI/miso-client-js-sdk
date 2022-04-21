import { API } from '../constants';

export default class ApiHelpers {

  constructor(client, root) {
    this._client = client;
    this._root = root;
  }

  assertReady() {
  }

  async fetch(url, payload, {
    method = 'POST',
  } = {}) {
    // TODO: organize arguments
    const body = JSON.stringify(payload);
    const res = await window.fetch(url, {
      method,
      body,
      cache: 'no-cache',
      mode: 'cors',
    });
    const resBody = await res.json();
    if (res.status >= 400 || resBody.errors) {
      var err = new Error(resBody.message);
      err.data = resBody;
      err.status = res.status;
      throw err;
    }
    return resBody;
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

  applyPayloadPasses(component, apiName, payload) {
    const apiGroup = component.meta.name;
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
