import { Component } from '@miso.ai/commons';
import AlgoliaClient from './client';

const PLUGIN_ID = 'std:algolia';

export default class AlgoliaPlugin extends Component {

  static get id() {
    return PLUGIN_ID;
  }

  constructor() {
    super(PLUGIN_ID);
  }

  install(MisoClient, context) {
    context.addSubtree(this);
    const self = this;
    Object.defineProperties(MisoClient.prototype, {
      algolia: {
        get: function() {
          return this._algolia || (this._algolia = new Algolia(self, this));
        }
      }
    });
  }

}

class Algolia {

  constructor(plugin, client) {
    this._plugin = plugin;
    this._client = client;
  }

  searchClient(options) {
    return this._createClient('search', options);
  }

  autocompleteClient(options) {
    return this._createClient('autocomplete', options);
  }

  _createClient(api, options = {}) {
    const client = new AlgoliaClient(this, { ...options, api });
    this._plugin._events.emit('client', client);
    return client;
  }

}
