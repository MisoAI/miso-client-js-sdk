import { Component, EventEmitter } from '@miso.ai/commons';
import observe from './data-layer.js';
import Ecommerce from './ecommerce.js';

const PLUGIN_ID = 'std:gtm';

export default class GtmPlugin extends Component {

  static get id() {
    return PLUGIN_ID;
  }

  constructor() {
    super(PLUGIN_ID);
    this._stream = new EventEmitter({
      error: this._error.bind(this),
      replays: ['data']
    });
  }

  install(MisoClient, context) {
    context.addSubtree(this);
    const plugin = this;
    Object.defineProperties(MisoClient.prototype, {
      gtm: {
        get: function() {
          return this._gtm || (this._gtm = new Gtm(plugin, this));
        }
      }
    });
    observe(this._stream.emit.bind(this._stream, 'data'));
  }

}

class Gtm extends Component {

  constructor(plugin, client) {
    super('gtm', plugin);
    this._events._replays.add('ecommerce');
    this._plugin = plugin;
    this._client = client;
  }

  get stream() {
    return this._plugin._stream;
  }

  // TODO: let user handle data in custom way
  // custom() {}

}

Object.defineProperties(Gtm.prototype, {
  ecommerce: {
    get: function() {
      if (!this._ecommerce) {
        this._events.emit('ecommerce', this._ecommerce = new Ecommerce(this));
      }
      return this._ecommerce;
    },
  }
});
