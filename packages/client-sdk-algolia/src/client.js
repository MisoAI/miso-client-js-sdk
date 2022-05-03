import { buildPayload, transformResponse } from './data';

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
      //console.log('request', request);
      const payload = this._buildPayload(request);
     // TODO: hook here
      const misoResponse = await this._client.api.search.search(payload);
      const response = this._transformResponse(request, misoResponse);
      // TODO: hook here
      //console.log('response', response);
      return response;
    } catch(e) {
      console.error(e);
      throw e;
    }
  }

  _buildPayload(request) {
    return buildPayload(this, request);
  }

  _transformResponse(request, response) {
    return transformResponse(this, request, response);
  }

  async searchForFacetValues(requests) {
    throw new Error(`searchForFacetValues() is not supported yet.`);
  }

}
