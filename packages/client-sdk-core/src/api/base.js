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

  async _run(apiName, payload) {
    this.helpers.assertReady();
    const url = this._url({ apiName, payload });
    payload = this._preprocess({ apiName, payload });
    const requestData = { apiName, payload, url };
    this._events.emit('request', requestData);
    const response = await this._send(requestData);
    const responseData = { ...requestData, response };
    this._events.emit('response', responseData);
    return this._postprocess(responseData);
  }

  _preprocess({ apiName, payload }) {
    return this.helpers.applyPayloadPasses(this, apiName, payload);
  }

  _url({ apiName }) {
    return this.helpers.url(this._apiPath, apiName);
  }

  async _send({ url, payload }) {
    return this.helpers.fetch(url, payload);
  }

  _postprocess({ response }) {
    // TODO: we can introduce response passes
    return response.data;
  }

}
