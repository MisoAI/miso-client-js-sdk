import { trimObj, nullifyIfEmptyObj, parseSearchToObject } from './util';
import { API }  from './constants';

export default class Api {

  constructor(app) {
    this._app = app;
  }

  // API //
  async interactionsUpload(data) {
    const url = this._apiUrl('interactions');
    return this._send(url, this._normalizeInteractionsUploadPayload(data));
  }

  _normalizeInteractionsUploadPayload(data) {
    if (typeof data !== 'object') {
      throw new Error(); // TODO
    }
    if (!Array.isArray(data)) {
      data = [data];
    }
    const {anonymous_id, user_id, miso_id} = this._app._config.effectively;
    const baseObj = trimObj({anonymous_id, user_id, miso_id, context: this._getContext()});
    data = data.map((obj) => Object.assign({}, baseObj, obj));
    return {data};
  }

  async recommendationUserToProducts(data) {
    const url = this._apiUrl('recommendation/user_to_products');
    return this._send(url, this._normalizeRecommendationUserToProductsPayload(data));
  }

  _normalizeRecommendationUserToProductsPayload(data) {
    const {anonymous_id, user_id, user_hash} = this._app._config.effectively;
    const profile = user_id ? {user_id, user_hash} : {anonymous_id, user_hash};
    data = Object.assign(profile, data);
    return data;
  }

  // helpers //
  async _send(url, payload, {
    method = 'POST',
  } = {}) {
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
    return resBody.data;
  }

  _apiUrl(apiName) {
    // TODO: allow overloading api_key here
    const {api_key, api_base_url} = this._app._config.effectively;
    return `${api_base_url}/${apiName}?api_key=${window.encodeURIComponent(api_key)}`;
  }

  _getContext() {
    return trimObj({
      page: this._readPageInfo(),
      campaign: this._readUtm()
    });
  }

  _readPageInfo() {
    return trimObj({
      url: window.location.href,
      referrer: document.referrer,
      title: document.title,
    });
  }

  _readUtm() {
    const {utm_source, utm_medium, utm_campaign, utm_term, utm_content} = parseSearchToObject(window.location.search);
    return nullifyIfEmptyObj(trimObj({
      source: utm_source,
      medium: utm_medium,
      name: utm_campaign,
      term: utm_term,
      content: utm_content
    }));
  }

}
