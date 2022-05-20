import { Component, defineValues, delegateGetters, assertNullableFunction } from '@miso.ai/commons';
import { buildPayload, transformResponse } from './data';

export default class AlgoliaClient extends Component {

  constructor(algolia, { api = 'search', handleSearch } = {}) {
    super('client', algolia._plugin);
    this._plugin = algolia._plugin;
    this._client = algolia._client;
    this._api = api;
    this._handleSearch = assertNullableFunction(handleSearch, value => `Parameter "handleSearch" must be a function: ${value}`);
    this._searchOne = this._searchOne.bind(this);
    this._searchApiContext = new SearchApiContext(this);
  }

  clearCache() {
  }

  async search(requests) {
    this._events.emit('request', ['search', requests]);
    const bulk = requests.length > 1;
    const response = {
      results: await Promise.all(requests.map(request => this._searchOne(request, bulk))),
    };
    this._events.emit('response', ['search', response]);
    return response;
  }

  async _searchOne(request, bulk) {
    try {
      const options = { bulk };
      return this._handleSearch ?
        this._handleSearch(this._searchApiContext, request, options) :
        this._searchApiContext.execute(request, options);
    } catch(e) {
      console.error(e);
      throw e;
    }
  }

  _buildPayload(apiName, request) {
    return buildPayload(this, apiName, request);
  }

  _transformResponse(apiName, request, response) {
    return transformResponse(this, apiName, request, response);
  }

  async searchForFacetValues(requests) {
    throw new Error(`searchForFacetValues() is not supported yet.`);
  }

}

class SearchApiContext {

  constructor(searchClient) {
    defineValues(this, { searchClient, misoClient: searchClient._client, misoApiName: searchClient._api });
    delegateGetters(this, this, ['execute', 'mapRequest', 'callMisoApi', 'mapResponse']);
  }

  async execute(request, options) {
    const apiName = this.misoApiName;
    const payload = this.mapRequest(apiName, request);
    const misoResponse = await this.callMisoApi(apiName, payload, options);
    return this.mapResponse(apiName, request, misoResponse);
  }

  mapRequest(apiName, request) {
    return buildPayload(this.searchClient, apiName, request);
  }

  async callMisoApi(apiName, payload, options) {
    return this.misoClient.api.search[apiName](payload, options);
  }

  mapResponse(apiName, request, response) {
    return transformResponse(this.searchClient, apiName, request, response);
  }

}