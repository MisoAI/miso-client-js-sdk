import ApiBase from './base';

export default class Recommendation extends ApiBase {

  constructor(api) {
    super(api, 'recommendation');
  }

  async userToProducts(payload, options) {
    return this._run('user_to_products', payload, options);
  }

  async userToCategories(payload) {
    return this._run('user_to_categories', payload, options);
  }

  async userToAttributes(payload) {
    return this._run('user_to_attributes', payload, options);
  }

  async userToTrending(payload) {
    return this._run('user_to_trending', payload, options);
  }

  async productToProducts(payload) {
    return this._run('product_to_products', payload, options);
  }

}
