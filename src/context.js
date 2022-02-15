import { trimObj } from './util/objects';
import createConfig from './util/config';
import Api from './api';
import { API, BUILD }  from './constants';

export default class Context {
  
  constructor() {
    this.version = BUILD.version;
    this.config = createConfig(this._normalizeConfig.bind(this));
    this.user = createConfig(this._normalizeUser.bind(this));
    this.api = new Api(this);
  }

  // TODO: mock

  _normalizeConfig(options) {
    const {api_key, api_base_url, env} = options;
    // TODO
    return trimObj({api_key, api_base_url, env});
  }

  _normalizeUser(options) {
    const {anonymous_id, user_id, user_hash} = options;
    return trimObj({anonymous_id, user_id, user_hash});
  }

}
