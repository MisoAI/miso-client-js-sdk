import ApiBase from './base';

export default class Recommendation extends ApiBase {

  constructor(api) {
    super(api, 'recommendation');
  }

  async user_to_products(payload) {
    return this._run('user_to_products', payload);
  }

  async user_to_categories(payload) {
    return this._run('user_to_products', payload);
  }

  async user_to_attributes(payload) {
    return this._run('user_to_attributes', payload);
  }

  async user_to_trending(payload) {
    return this._run('user_to_trending', payload);
  }

  async product_to_products(payload) {
    return this._run('product_to_products', payload);
  }

}
