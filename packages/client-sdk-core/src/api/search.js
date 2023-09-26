import { API } from '@miso.ai/commons';
import ApiBase from './base.js';

const { GROUP, NAME } = API;

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
