export default class Recommendation {

  constructor(api) {
    this._api = api;
  }

  async user_to_products(data) {
    const url = this._api.helpers.url('recommendation/user_to_products');
    return this._api.helpers.fetch(url, this._normalizeUserToProductsPayload(data));
  }

  _normalizeUserToProductsPayload(data) {
    // TODO: extract profile parts
    const {anonymous_id, user_id, user_hash} = this._api._context._config.effectively;
    const profile = user_id ? {user_id, user_hash} : {anonymous_id, user_hash};
    data = Object.assign(profile, data);
    return data;
  }

}
