import { obj$, parseSearchToObject } from '../util';
import { API }  from '../constants';

export default class Api {

  constructor(context) {
    this._context = context;
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
    const {anonymous_id, user_id, miso_id} = this._context._config.effectively;
    const baseObj = obj$({anonymous_id, user_id, miso_id, context: this._getContext()}).value;
    data = data.map((obj) => Object.assign({}, baseObj, obj));
    return {data};
  }

  async recommendationUserToProducts(data) {
    const url = this._apiUrl('recommendation/user_to_products');
    return this._send(url, this._normalizeRecommendationUserToProductsPayload(data));
  }

  _normalizeRecommendationUserToProductsPayload(data) {
    const {anonymous_id, user_id, user_hash} = this._context._config.effectively;
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
    let {api_key, api_base_url, mock} = this._context._config.effectively;
    // TODO: refine this
    if (mock) {
      api_base_url = API.MOCK_SERVER_URL;
    }
    return `${api_base_url}/${apiName}?api_key=${window.encodeURIComponent(api_key)}`;
  }

  _getContext() {
    return obj$({
      page: this._readPageInfo(),
      campaign: this._readUtm()
    }).trim().value;
  }

  _readPageInfo() {
    return obj$({
      url: window.location.href,
      referrer: document.referrer,
      title: document.title,
    }).trim().value;
  }

  _readUtm() {
    const {utm_source, utm_medium, utm_campaign, utm_term, utm_content} = parseSearchToObject(window.location.search);
    return obj$({
      source: utm_source,
      medium: utm_medium,
      name: utm_campaign,
      term: utm_term,
      content: utm_content
    }).trim().emptyToUndefined().value;
  }

}
