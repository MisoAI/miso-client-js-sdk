import { buildPayload, transformResponse } from './data';

export default class AlgoliaClient {

  constructor(client, { api =  'search' } = {}) {
    this._client = client;
    this._api = api;
    this._searchOne = this._searchOne.bind(this);
  }

  clearCache() {
  }

  async search(requests) {
    const bulk = requests.length > 1;
    return {
      results: await Promise.all(requests.map(request => this._searchOne(request, bulk))),
    };
  }

  async _searchOne(request, bulk) {
    try {
      //console.log('request', request);
      const [ engine_id, apiName ] = this._getEngineIdAndApiName(request);
      request = { ...request, engine_id, apiName };
      const payload = this._buildPayload(request);
     // TODO: hook here
      const misoResponse = await this._client.api.search[apiName](payload, { bulk });
      const response = this._transformResponse(request, misoResponse);
      // TODO: hook here
      //console.log('response', response);
      return response;
    } catch(e) {
      console.error(e);
      throw e;
    }
  }

  _getEngineIdAndApiName({ indexName }) {
    let engine_id;
    let api = this._api;
    if (indexName) {
      const [ e, a ] = indexName.trim().split(':');
      engine_id = e || undefined;
      api = a || api;
    }
    return [ engine_id, api ];
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
