import { trimObj } from './util/objects';
import createConfig from './util/config';
import Api from './api';
import { API, BUILD }  from './constants';

export default class Context {
  
  constructor() {
    this.version = BUILD.version;
    this.config = createConfig(this._normalizeConfig.bind(this));
    this.api = new Api(this);
  }

  // TODO: mock

  _normalizeConfig(values) {
    const {api_key, api_base_url, anonymous_id, user_id, user_hash, miso_id, mock} = values;
    // TODO
    return trimObj({api_key, api_base_url, anonymous_id, user_id, user_hash, miso_id, mock});
  }

}
