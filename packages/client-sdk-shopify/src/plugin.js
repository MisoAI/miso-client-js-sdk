import { Component } from '@miso.ai/commons';
import * as utils from 'shopify-store-utils';
import { Cart } from './cart';
import { Page } from './page';

const { getCustomerId, getAnonymousUserToken } = utils;

const PLUGIN_ID = 'std:shopify';

export default class ShopifyPlugin extends Component {

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
      shopify: {
        get: function() {
          return this._shopify || (this._shopify = new Shopify(self, this));
        }
      }
    });
  }

}

class Shopify extends Component {

  constructor(plugin, client) {
    super('shopify', plugin);
    this._plugin = plugin;
    this._client = client;
    this.utils = utils;
  }

  auto() {
    this.syncUser();
    this.capturePageViewEvents();
    this.captureCartEvents();
  }

  syncUser() {
    const context = this._client.context;
    const userToken = getAnonymousUserToken();
    if (userToken) {
      context.anonymous_id = `${userToken}`;
    }
    const customerId = getCustomerId();
    if (customerId) {
      context.user_id =`${customerId}`;
    }
  }

  capturePageViewEvents(options) {
    (this._page || (this._page = new Page(this))).start(options);
  }

  captureCartEvents(options) {
    (this._cart || (this._cart = new Cart(this))).start(options);
  }

}
