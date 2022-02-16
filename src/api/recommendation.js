import ApiBase from './base';

export default class Recommendation extends ApiBase {

  constructor(api) {
    super(api);
  }

  async user_to_products(payload) {
    this.helpers.assertReady();
    const url = this.helpers.url('recommendation/user_to_products');
    payload = this._normalizeUserToProductsPayload(payload);
    return this.helpers.fetch(url, payload);
  }

  async user_to_categories(payload) {
    this.helpers.assertReady();
    const url = this.helpers.url('recommendation/user_to_categories');
    payload = this._normalizeUserToCategoriesPayload(payload);
    return this.helpers.fetch(url, payload);
  }

  async user_to_attributes(payload) {
    this.helpers.assertReady();
    const url = this.helpers.url('recommendation/user_to_attributes');
    payload = this._normalizeUserToAttributesPayload(payload);
    return this.helpers.fetch(url, payload);
  }

  async user_to_trending(payload) {
    this.helpers.assertReady();
    const url = this.helpers.url('recommendation/user_to_trending');
    payload = this._normalizeUserToTrendingPayload(payload);
    return this.helpers.fetch(url, payload);
  }

  async product_to_products(payload) {
    this.helpers.assertReady();
    const url = this.helpers.url('recommendation/product_to_products');
    payload = this._normalizeProductToProductsPayload(payload);
    return this.helpers.fetch(url, payload);
  }

  _normalizeUserToProductsPayload(payload) {
    return this.helpers.injectUserInfo(payload);
  }

  _normalizeUserToCategoriesPayload(payload) {
    return this.helpers.injectUserInfo(payload);
  }

  _normalizeUserToAttributesPayload(payload) {
    return this.helpers.injectUserInfo(payload);
  }

  _normalizeUserToTrendingPayload(payload) {
    return this.helpers.injectUserInfo(payload);
  }

  _normalizeProductToProductsPayload(payload) {
    return this.helpers.injectUserInfo(payload);
  }

}
