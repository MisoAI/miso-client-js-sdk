import { trimObj } from '@miso.ai/commons/dist/es/objects';
import { API } from '../constants';
import { readPageInfo, readUtm } from '../util/url';

export default class ApiHelpers {

  constructor(client) {
    this._client = client;
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

  buildPayloadContext() {
    return trimObj({
      page: readPageInfo(),
      campaign: readUtm()
    });
  }

  get userInfoForQuery() {
    const { user_id, user_hash, anonymous_id, anonymous_hash } = this._client.context.userInfo;
    return user_id ? { user_id, user_hash } : { anonymous_id, user_hash: anonymous_hash };
  }

  injectUserInfo(payload) {
    return { ...this.userInfoForQuery, ...payload };
  }

}
