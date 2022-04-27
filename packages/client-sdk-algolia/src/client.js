import { trimObj } from '@miso.ai/commons';

export default class AlgoliaClient {

  constructor(client) {
    this._client = client;
    this._searchOne = this._searchOne.bind(this);
  }

  clearCache() {
  }

  async search(requests) {
    const results = await Promise.all(requests.map(this._searchOne));
    return { results };
  }

  async _searchOne(request) {
    const { query } = request.params || {};
    if (!query) {
      return { hits: [] };
    }
    const payload = this._buildPayload(request);
    const response = await this._client.api.search.search(payload);
    return this._transformResponse(response);
  }

  _buildPayload({ indexName, params = {} }) {
    const { query } = params;
    return trimObj({
      engine_id: indexName || undefined,
      q: query,
      fl: ['*'],
    });
  }

  _transformResponse({ products }) {
    return {
      hits: products
    };
  }

  async searchForFacetValues(requests) {
    throw new Error(`searchForFacetValues() is not supported yet.`);
  }

}
