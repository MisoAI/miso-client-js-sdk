export default class Interactions {

  constructor(api) {
    this._api = api;
  }

  async upload(data) {
    const url = this._api.helpers.url('interactions');
    return this._api.helpers.fetch(url, this._normalizeUploadPayload(data));
  }

  _normalizeUploadPayload(data) {
    if (typeof data !== 'object') {
      throw new Error(); // TODO
    }
    if (!Array.isArray(data)) {
      data = [data];
    }
    const {anonymous_id, user_id, miso_id} = this._api._context._config.effectively;
    const baseObj = obj$({anonymous_id, user_id, miso_id, context: this._api.helpers.buildPayloadContext()}).value;
    data = data.map((obj) => Object.assign({}, baseObj, obj));
    return {data};
  }

}
