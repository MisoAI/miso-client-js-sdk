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
    this.helpers.assertReady();
    const { bulk } = options;
    const bulkInfo = bulk ? { bulk: this.helpers.bulkInfo } : undefined;
    const apiGroup = this._apiPath;
    const url = this._url({ apiGroup, apiName, payload, options });
    payload = this._preprocess({ apiGroup, apiName, payload, options });
    const requestData = { apiGroup, apiName, payload, url, options };
    this._events.emit('request', { ...requestData, ...bulkInfo });
    const response = await this._send(requestData);
    const responseData = { ...requestData, response };
    this._events.emit('response', { ...responseData, ...bulkInfo });
    return this._postprocess(responseData);
  }

  _preprocess({ apiGroup, apiName, payload }) {
    return this.helpers.applyPayloadPasses(this, apiGroup, apiName, payload);
  }

  _url({ apiGroup, apiName }) {
    return this.helpers.url(apiGroup, apiName);
  }

  async _send({ apiGroup, apiName, url, payload, options: { bulk, timeout } = {} }) {
    return bulk ? this.helpers.fetchForBulk(apiGroup, apiName, payload) : this.helpers.fetch(url, payload, { timeout });
  }

  _postprocess({ response }) {
    // TODO: we can introduce response passes
    return response.data;
  }

}
