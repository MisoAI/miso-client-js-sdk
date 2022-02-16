import ApiBase from './base';

export default class Search extends ApiBase {

  constructor(api) {
    super(api);
  }

  async search(payload) {
    this.helpers.assertReady();
    const url = this.helpers.url('search/search');
    payload = this._normalizeSearchPayload(payload);
    return this.helpers.fetch(url, payload);
  }

  async autocomplete(payload) {
    this.helpers.assertReady();
    const url = this.helpers.url('search/autocomplete');
    payload = this._normalizeAutocompletePayload(payload);
    return this.helpers.fetch(url, payload);
  }

  async mget(payload) {
    this.helpers.assertReady();
    const url = this.helpers.url('search/mget');
    payload = this._normalizeMgetPayload(payload);
    return this.helpers.fetch(url, payload);
  }

  _normalizeSearchPayload(payload) {
    return this.helpers.injectUserInfo(payload);
  }

  _normalizeAutocompletePayload(payload) {
    return this.helpers.injectUserInfo(payload);
  }

  _normalizeMgetPayload(payload) {
    return this.helpers.injectUserInfo(payload);
  }

}
