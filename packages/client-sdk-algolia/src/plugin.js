import AlgoliaClient from './client';

const ID = 'std:algolia';

export default class AlgoliaPlugin {

  static get id() {
    return ID;
  }

  constructor() {
  }

  install(MisoClient) {
    Object.assign(MisoClient.prototype, {
      algoliaClient: function(options) {
        return new AlgoliaClient(this, options);
      }
    });
  }

}
