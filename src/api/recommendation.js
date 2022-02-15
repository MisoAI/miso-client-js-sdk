import { trimObj } from '../util/objects';
import ApiBase from './base';

export default class Recommendation extends ApiBase {

  constructor(api) {
    super(api);
  }

  async user_to_products(data) {
    const url = this.helpers.url('recommendation/user_to_products');
    return this.helpers.fetch(url, this._normalizeUserToProductsPayload(data));
  }

  _normalizeUserToProductsPayload(data) {
    // TODO: extract profile parts
    const {anonymous_id, user_id, user_hash} = this.user.values;
    const profile = trimObj(user_id ? {user_id, user_hash} : {anonymous_id, user_hash});
    data = Object.assign(profile, data);
    return data;
  }

}
