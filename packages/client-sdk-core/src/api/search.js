import ApiBase from './base';

export default class Search extends ApiBase {

  constructor(api) {
    super(api, 'search');
  }

  async search(payload, options) {
    return this._run('search', payload, options);
  }

  async autocomplete(payload, options) {
    return this._run('autocomplete', payload, options);
  }

  async multipleGet(payload, options) {
    return this._run('mget', payload, options);
  }

}
