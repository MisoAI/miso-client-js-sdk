import AlgoliaClient from './client';

const ID = 'std:algolia';

export default class AlgoliaPlugin {

  static get id() {
    return ID;
  }

  constructor() {
  }

  install(MisoClient) {
    Object.defineProperties(MisoClient.prototype, {
      algolia: {
        get: function() {
          return this._algolia || (this._algolia = new Algolia(this));
        }
      }
    });
  }

}

class Algolia {

  constructor(client) {
    this._client = client;
  }

  searchClient(options = {}) {
    return new AlgoliaClient(this._client, { ...options, api: 'search' });
  }

  autocompleteClient(options = {}) {
    return new AlgoliaClient(this._client, { ...options, api: 'autocomplete' });
  }

}
