import ApiBase from './base';

export default class Search extends ApiBase {

  constructor(api) {
    super(api);
  }

  async search(payload) {
    const url = this.helpers.url('search/search');
    payload = this._normalizeSearchPayload(payload);
    return this.helpers.fetch(url, payload);
  }

  async autocomplete(payload) {
    const url = this.helpers.url('search/autocomplete');
    payload = this._normalizeAutocompletePayload(payload);
    return this.helpers.fetch(url, payload);
  }

  async mget(payload) {
    const url = this.helpers.url('search/mget');
    payload = this._normalizeMgetPayload(payload);
    return this.helpers.fetch(url, payload);
  }

  _normalizeSearchPayload(payload) {
    return Object.assign({}, this.helpers.userInfo, payload);
  }

  _normalizeAutocompletePayload(payload) {
    return Object.assign({}, this.helpers.userInfo, payload);
  }

  _normalizeMgetPayload(payload) {
    return Object.assign({}, this.helpers.userInfo, payload);
  }

}
