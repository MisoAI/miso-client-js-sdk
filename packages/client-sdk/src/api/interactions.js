import { trimObj } from '@miso.ai/commons/dist/es/objects';
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

  _preprocess({ apiName, payload }) {
    switch (apiName) {
      case 'upload':
        return this._preprocessUpload(payload);
      default:
        return super._preprocess({ apiName, payload });
    }
  }

  _preprocessUpload(payload) {
    if (typeof payload !== 'object') {
      throw new Error(); // TODO
    }
    if (!Array.isArray(payload)) {
      payload = [payload];
    }
    const { anonymous_id, user_id } = this.context.userInfo;
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
