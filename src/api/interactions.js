import { trimObj } from '../util/objects';
import ApiBase from './base';

export default class Interactions extends ApiBase {

  constructor(api) {
    super(api, 'interactions');
  }

  async upload(payload) {
    return this._run('upload', payload);
  }

  _url() {
    return this.helpers.url(this._apiPath);
  }

  _preprocess({ type, payload }) {
    switch (type) {
      case 'upload':
        return this._preprocessUpload(payload);
      default:
        return super._preprocess({ type, payload });
    }
  }

  _preprocessUpload(payload) {
    if (typeof payload !== 'object') {
      throw new Error(); // TODO
    }
    if (!Array.isArray(payload)) {
      payload = [payload];
    }
    const { anonymous_id, user_id } = this.user.values;
    const baseObj = trimObj({
      anonymous_id,
      user_id,
      context: this.helpers.buildPayloadContext()
    });
    payload = payload.map((obj) => Object.assign({}, baseObj, obj));
    // TODO: think about how to align payload with API signature
    return { data: payload };
  }

}
