import ApiBase from './base';

export default class Recommendation extends ApiBase {

  constructor(api) {
    super(api, 'recommendation');
  }

  async userToProducts(payload, options) {
    return this._run('user_to_products', payload, options);
  }

  async userToCategories(payload, options) {
    return this._run('user_to_categories', payload, options);
  }

  async userToAttributes(payload, options) {
    return this._run('user_to_attributes', payload, options);
  }

  async userToTrending(payload, options) {
    return this._run('user_to_trending', payload, options);
  }

  async userToHistory(payload, options) {
    return this._run('user_to_history', payload, options);
  }

  async productToProducts(payload, options) {
    return this._run('product_to_products', payload, options);
  }

}
