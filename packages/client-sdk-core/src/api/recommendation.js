import { GROUP, NAME } from './constants.js';
import ApiBase from './base.js';

export default class Recommendation extends ApiBase {

  constructor(api) {
    super(api, GROUP.RECOMMENDATION);
  }

  async userToProducts(payload, options) {
    return this._run(NAME.USER_TO_PRODUCTS, payload, options);
  }

  async userToCategories(payload, options) {
    return this._run(NAME.USER_TO_CATEGORIES, payload, options);
  }

  async userToAttributes(payload, options) {
    return this._run(NAME.USER_TO_ATTRIBUTES, payload, options);
  }

  async userToTrending(payload, options) {
    return this._run(NAME.USER_TO_TRENDING, payload, options);
  }

  async userToHistory(payload, options) {
    return this._run(NAME.USER_TO_HISTORY, payload, options);
  }

  async productToProducts(payload, options) {
    return this._run(NAME.PRODUCT_TO_PRODUCTS, payload, options);
  }

}
