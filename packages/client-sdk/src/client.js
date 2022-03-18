import { trimObj } from './util/objects';
import Api from './api';
import Context from './context';
import getAdmin from './admin';
import defaultMods from './mod';

class MisoClient {

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
      return { apiKey: options };
    }
    // TODO: option: debug
    const { apiKey, apiHost, disableAutoAnonymousId } = options || {};
    if (!apiKey) {
      throw new Error('Require API key to initialize miso client.');
    }
    return trimObj({ apiKey, apiHost, disableAutoAnonymousId });
  }

}

MisoClient.mods = Object.assign({}, defaultMods);

export default MisoClient;