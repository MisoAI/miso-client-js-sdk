import { trimObj } from '../util/objects';
import { API }  from '../constants';
import { readPageInfo, readUtm } from '../util/url';

export default class Helpers {

  constructor(context) {
    this._context = context;
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

  url(apiName) {
    // TODO: allow overloading api_key here
    let {api_key, api_base_url = API.BASE_URL, mock} = this._context.config.values;
    // TODO: refine this
    if (mock) {
      api_base_url = API.MOCK_SERVER_URL;
    }
    return `${api_base_url}/${apiName}?api_key=${window.encodeURIComponent(api_key)}`;
  }

  buildPayloadContext() {
    return trimObj({
      page: readPageInfo(),
      campaign: readUtm()
    });
  }

}
