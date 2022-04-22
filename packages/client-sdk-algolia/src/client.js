export default class AlgoliaClient {

  constructor(client) {
    this._client = client;
  }

  clearCache() {
  }

  search(requests) {
    // TODO
  }

  searchForFacetValues(requests) {
    throw new Error(`searchForFacetValues() is not supported yet.`);
  }

}
