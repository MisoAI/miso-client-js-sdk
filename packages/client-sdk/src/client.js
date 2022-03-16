import { trimObj } from './util/objects';
import Api from './api';
import Context from './context';
import getAdmin from './admin';

export default class MisoClient {

  constructor(options) {
    this._admin = getAdmin(this);
    this._config(options);
    this.context = new Context(this);
    this.api = new Api(this);
  }

  get version() {
    return this._admin.version;
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

}
