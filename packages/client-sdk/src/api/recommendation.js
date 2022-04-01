import ApiBase from './base';

export default class Recommendation extends ApiBase {

  constructor(api) {
    super(api, 'recommendation');
  }

  async userToProducts(payload) {
    return this._run('user_to_products', payload);
  }

  async userToCategories(payload) {
    return this._run('user_to_categories', payload);
  }

  async userToAttributes(payload) {
    return this._run('user_to_attributes', payload);
  }

  async userToTrending(payload) {
    return this._run('user_to_trending', payload);
  }

  async productToProducts(payload) {
    return this._run('product_to_products', payload);
  }

}
