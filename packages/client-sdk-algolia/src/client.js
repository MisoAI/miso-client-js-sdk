import { buildPayload } from './request';

export default class AlgoliaClient {

  constructor(client) {
    this._client = client;
    this._searchOne = this._searchOne.bind(this);
  }

  clearCache() {
  }

  async search(requests) {
    return {
      results: await Promise.all(requests.map(this._searchOne)),
    };
  }

  async _searchOne(request) {
    try {
      const { query } = request.params || {};
      if (!query) {
        return { hits: [] };
      }
      console.log(request);
      const payload = this._buildPayload(request);
      const response = await this._client.api.search.search(payload);
      return this._transformResponse(response);
    } catch(e) {
      console.error(e);
      throw e;
    }
  }

  _buildPayload(request) {
    return buildPayload(this, request);
  }

  _transformResponse({ products }) {
    return {
      hits: products,
    };
  }

  async searchForFacetValues(requests) {
    throw new Error(`searchForFacetValues() is not supported yet.`);
  }

}
