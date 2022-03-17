import { trimObj } from '../util/objects';
import { API } from '../constants';
import { readPageInfo, readUtm } from '../util/url';

export default class Helpers {

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
      throw err;
    }
    return resBody;
  }

  url(...paths) {
    const apiName = paths.filter(s => s).join('/');
    // TODO: allow overloading API key here?
    let { apiKey, apiBaseUrl = API.BASE_URL, env } = this._client.config;
    // TODO: refine this
    if (env === 'mock') {
      apiBaseUrl = API.MOCK_SERVER_URL;
    }
    return `${apiBaseUrl}/${apiName}?api_key=${window.encodeURIComponent(apiKey)}`;
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
    return Object.assign({}, this.userInfoForQuery, payload);
  }

}
