import { trimObj } from './util/objects';
import createConfig from './util/config';
import Api from './api';
import { BUILD } from './constants';

export default class Context {

  constructor() {
    this.version = BUILD.version;
    this._config = createConfig(this._normalizeConfig.bind(this));
    this.config = this._config.readonly;
    this.user = createConfig(this._normalizeUser.bind(this));
    this.api = new Api(this);
    this._ready = false;
  }

  init(options) {
    if (this._ready) {
      // TODO: log handler
      console.warn('Miso client has already been initialized. The second init() call is ignored.');
      return;
    }
    this._config(options);
    this._validateConfig(this.config.values);
    this._ready = true;
  }

  get ready() {
    return this._ready;
  }

  _normalizeConfig({ api_key, api_base_url, env } = {}) {
    return trimObj({ api_key, api_base_url, env });
  }

  _validateConfig(values) {
    const { api_key } = values;
    if (!api_key) {
      throw new Error('Require API key to initialize miso client.');
    }
  }

  _normalizeUser({ anonymous_id, user_id, user_hash } = {}) {
    return trimObj({ anonymous_id, user_id, user_hash });
  }

}
