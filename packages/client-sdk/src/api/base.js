import Component from '../util/component';

export default class ApiBase extends Component {

  // TODO: use private fields (may encounter issues with rollup)

  constructor(api, apiPath) {
    super('api', api._client);
    this._apiPath = apiPath;
    this.helpers = api.helpers;
    this.config = api._client.config;
    this.context = api._client.context;
  }

  async _run(type, payload) {
    this.helpers.assertReady();
    const url = this._url({ type, payload });
    payload = this._preprocess({ type, payload });
    this._events.emit('before-send', type, payload);
    const response = await this._send({ type, url, payload });
    this._events.emit('after-send', type, payload, response);
    return this._postprocess({ type, payload, response });
  }

  _preprocess({ payload }) {
    return this.helpers.injectUserInfo(payload);
  }

  _url({ type }) {
    return this.helpers.url(this._apiPath, type);
  }

  async _send({ url, payload }) {
    return this.helpers.fetch(url, payload);
  }

  _postprocess({ response }) {
    return response.data;
  }

}
