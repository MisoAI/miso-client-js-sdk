export default class ApiBase {

  // TODO: use private fields (may encounter issues with rollup)

  constructor(api, apiPath) {
    this._apiPath = apiPath;
    this.helpers = api.helpers;
    this.config = api._context.config.readonly;
    this.user = api._context.user.readonly;
  }

  async _run(type, payload) {
    this.helpers.assertReady();
    const url = this._url({ type, payload });
    payload = this._preprocess({ type, payload });
    const response = await this._send({ type, url, payload });
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
    return response;
  }

}
