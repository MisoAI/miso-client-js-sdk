/** @module core */

import { API } from '@miso.ai/commons';
import ApiBase from './base.js';

const { GROUP, NAME } = API;

/**
 * Recommendation APIs, available as `client.api.recommendation`.
 */
class Recommendation extends ApiBase {

  constructor(api) {
    super(api, GROUP.RECOMMENDATION);
  }

  /**
   * Recommend products for the current user.
   *
   * @param {Object} payload
   * @param {Object} [options] - Request options.
   * @returns {Promise<Object>}
   */
  async userToProducts(payload, options) {
    return this._run(NAME.USER_TO_PRODUCTS, payload, options);
  }

  /**
   * Recommend categories for the current user.
   *
   * @param {Object} payload
   * @param {Object} [options] - Request options.
   * @returns {Promise<Object>}
   */
  async userToCategories(payload, options) {
    return this._run(NAME.USER_TO_CATEGORIES, payload, options);
  }

  /**
   * Recommend attribute values for the current user.
   *
   * @param {Object} payload
   * @param {Object} [options] - Request options.
   * @returns {Promise<Object>}
   */
  async userToAttributes(payload, options) {
    return this._run(NAME.USER_TO_ATTRIBUTES, payload, options);
  }

  /**
   * Recommend trending products for the current user.
   *
   * @param {Object} payload
   * @param {Object} [options] - Request options.
   * @returns {Promise<Object>}
   */
  async userToTrending(payload, options) {
    return this._run(NAME.USER_TO_TRENDING, payload, options);
  }

  /**
   * Get products the current user has interacted with.
   *
   * @param {Object} payload
   * @param {Object} [options] - Request options.
   * @returns {Promise<Object>}
   */
  async userToHistory(payload, options) {
    return this._run(NAME.USER_TO_HISTORY, payload, options);
  }

  /**
   * Recommend products related to a given product.
   *
   * @param {Object} payload
   * @param {Object} [options] - Request options.
   * @returns {Promise<Object>}
   */
  async productToProducts(payload, options) {
    return this._run(NAME.PRODUCT_TO_PRODUCTS, payload, options);
  }

}

export default Recommendation;
