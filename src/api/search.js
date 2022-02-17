import ApiBase from './base';

export default class Search extends ApiBase {

  constructor(api) {
    super(api, 'search');
  }

  async search(payload) {
    return this._run('search', payload);
  }

  async autocomplete(payload) {
    return this._run('autocomplete', payload);
  }

  async mget(payload) {
    return this._run('mget', payload);
  }

}
