import { Component } from '@miso.ai/commons';

export default class ApiBase extends Component {

  // TODO: use private fields (may encounter issues with rollup)

  constructor(api, apiPath) {
    super(apiPath, api);
    this._apiPath = apiPath;
    this.helpers = api.helpers;
    this.clientOptions = api._client.options;
    this.context = api._client.context;
  }

  async _run(apiName, payload, options = {}) {
    const { bulk } = options;
    const bulkInfo = bulk ? { bulk: this.helpers.bulkInfo } : undefined;
    const apiGroup = this._apiPath;
    const url = this._url({ apiGroup, apiName, payload, options });
    const headers = this._headers({ apiGroup, apiName, payload, options });
    payload = this._preprocess({ apiGroup, apiName, payload, options });
    const requestData = { apiGroup, apiName, payload, url, headers, options };
    this._events.emit('request', { ...requestData, ...bulkInfo });
    const response = await this._send(requestData);
    const responseData = { ...requestData, response };
    this._events.emit('response', { ...responseData, ...bulkInfo });
    return this._postprocess(responseData);
  }

  _headers({ apiGroup, apiName, payload, options }) {
    return this.helpers.applyHeaderPasses(this, { apiGroup, apiName, payload, headers: {}, options });
  }

  _preprocess({ apiGroup, apiName, payload, options }) {
    return this.helpers.applyPayloadPasses(this, { apiGroup, apiName, payload, options });
  }

  _url({ apiGroup, apiName, options }) {
    const url = this.helpers.url([apiGroup, apiName], options);
    return this.helpers.applyUrlPasses(this, { apiGroup, apiName, url, options });
  }

  async _send({ apiGroup, apiName, url, headers, payload, options: { bulk, ...options } = {} }) {
    return bulk ? this.helpers.fetchForBulk(apiGroup, apiName, payload) : this.helpers.fetch(url, payload, { ...options, headers });
  }

  _postprocess({ response }) {
    // TODO: we can introduce response passes
    return response.data;
  }

}
