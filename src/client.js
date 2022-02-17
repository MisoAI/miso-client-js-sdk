import { trimObj } from './util/objects';
import createConfig from './util/config';
import Api from './api';
import getContext from './context';

export default class MisoClient {

  constructor(options) {
    this._context = getContext(this);
    this._config(options);
    this.user = createConfig(this._normalizeUser.bind(this));
    this.api = new Api(this);
  }

  get version() {
    return this._context.version;
  }

  _config(options) {
    this.config = Object.freeze(this._normalizeConfig(options));
  }

  _normalizeConfig(options) {
    if (typeof options === 'string') {
      return { api_key: options };
    }
    const { api_key, api_base_url, env } = options || {};
    if (!api_key) {
      throw new Error('Require API key to initialize miso client.');
    }
    return trimObj({ api_key, api_base_url, env });
  }

  _normalizeUser({ anonymous_id, user_id, user_hash } = {}) {
    return trimObj({ anonymous_id, user_id, user_hash });
  }

}
