import { GROUP, NAME } from './constants.js';
import ApiBase from './base.js';

export default class Search extends ApiBase {

  constructor(api) {
    super(api, GROUP.SEARCH);
  }

  async search(payload, options) {
    return this._run(NAME.SEARCH, payload, options);
  }

  async autocomplete(payload, options) {
    return this._run(NAME.AUTOCOMPLETE, payload, options);
  }

  async multipleGet(payload, options) {
    return this._run(NAME.MGET, payload, options);
  }

}
