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
      algoliaClient: {
        get: function() {
          return this._algoliaClient || (this._algoliaClient = new AlgoliaClient(this));
        }
      }
    });
  }

}
