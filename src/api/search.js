import { trimObj } from '../util/objects';
import ApiBase from './base';

export default class Search extends ApiBase {

  constructor(api) {
    super(api);
  }

  async search(data) {
    const url = this.helpers.url('search/search');
    return this.helpers.fetch(url, this._normalizeSearchPayload(data));
  }

  _normalizeSearchPayload(data) {
    return Object.assign({}, this.helpers.userInfo, data);
  }

}
