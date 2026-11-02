import { API } from '@miso.ai/commons';
import ApiBase from './base.js';

const { GROUP, NAME } = API;

/**
 * Search APIs, available as `client.api.search`.
 */
export default class Search extends ApiBase {

  constructor(api) {
    super(api, GROUP.SEARCH);
  }

  /**
   * Search products with a query.
   *
   * @param {Object} payload
   * @param {Object} [options] - Request options.
   * @returns {Promise<Object>}
   */
  async search(payload, options) {
    return this._run(NAME.SEARCH, payload, options);
  }

  /**
   * Get autocomplete suggestions for a partial search query.
   *
   * @param {Object} payload
   * @param {Object} [options] - Request options.
   * @returns {Promise<Object>}
   */
  async autocomplete(payload, options) {
    return this._run(NAME.AUTOCOMPLETE, payload, options);
  }

  /**
   * Get multiple products by their IDs.
   *
   * @param {Object} payload
   * @param {Object} [options] - Request options.
   * @returns {Promise<Object>}
   */
  async multipleGet(payload, options) {
    return this._run(NAME.MGET, payload, options);
  }

}
