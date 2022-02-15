import { trimObj } from '../util/objects';
import ApiBase from './base';

export default class Interactions extends ApiBase {

  constructor(api) {
    super(api);
  }

  async upload(data) {
    const url = this.helpers.url('interactions');
    return this.helpers.fetch(url, this._normalizeUploadPayload(data));
  }

  _normalizeUploadPayload(data) {
    if (typeof data !== 'object') {
      throw new Error(); // TODO
    }
    if (!Array.isArray(data)) {
      data = [data];
    }
    const {anonymous_id, user_id} = this.user.values;
    const baseObj = trimObj({
      anonymous_id, 
      user_id, 
      context: this.helpers.buildPayloadContext()
    });
    data = data.map((obj) => Object.assign({}, baseObj, obj));
    return {data};
  }

}
