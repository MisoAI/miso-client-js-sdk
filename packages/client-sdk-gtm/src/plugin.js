import { Component } from '@miso.ai/commons';
import observe from './data-layer';
import Ecommerce from './ecommerce';

const PLUGIN_ID = 'std:gtm';

export default class GtmPlugin extends Component {

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
      gtm: {
        get: function() {
          return this._gtm || (this._gtm = new Gtm(self, this));
        }
      }
    });
    observe(this._observe.bind(this));
  }

  _observe(data) {
    this._events.emit('data', data);
  }

}

class Gtm extends Component {

  constructor(plugin, client) {
    super('gtm', plugin);
    this._plugin = plugin;
    this._client = client;
  }

  ecommerce(options) {
    if (!this._ecommerce) {
      options = options || {};
      this._ecommerce = new Ecommerce(this);
    }
    if (options) {
      this._ecommerce._setup(options);
      this._events.emit('ecommerce', options);
    }
  }

}
