import { trimObj } from '../util/objects';
import ApiBase from './base';

export default class Interactions extends ApiBase {

  constructor(api) {
    super(api);
  }

  async upload(payload) {
    const url = this.helpers.url('interactions');
    payload = this._normalizeUploadPayload(payload);
    return this.helpers.fetch(url, payload);
  }

  _normalizeUploadPayload(payload) {
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
