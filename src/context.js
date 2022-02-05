import { trimObj } from './util';
import Config from './util/config';
import Api from './api';
import { API }  from './constants';

const DEFAULT_CONFIG = new Config(undefined, {
  api_base_url: API.BASE_URL,
});

export default class Context {
  
  constructor() {
    const c = this._config = new Config(DEFAULT_CONFIG);
    Object.defineProperty(this.config, 'values', {
      get: function() {
        return c.values;
      }
    });
    this.api = new Api(this);
    this.version = __version__;
  }

  config(values) {
    if (typeof values === 'object') {
      Object.assign(this._config, this._normalizeConfigValues(values));
    }
    return this;
  }

  // TODO: mock

  _normalizeConfigValues(values) {
    const {api_key, api_base_url, anonymous_id, user_id, user_hash, miso_id, mock} = values;
    // TODO
    return trimObj({api_key, api_base_url, anonymous_id, user_id, user_hash, miso_id, mock});
  }

}
