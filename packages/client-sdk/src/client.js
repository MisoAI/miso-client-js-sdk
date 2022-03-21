import { BUILD } from './constants';
import { trimObj } from './util/objects';
import Api from './api';
import Context from './context';
import defaultMods from './mod';

class MisoClient {

  constructor(options) {
    this.constructor.instances.push(this);
    this._config(options);

    this.context = new Context(this);
    this.api = new Api(this);
  }

  get version() {
    return this.constructor.version;
  }

  _config(options) {
    this.config = Object.freeze(this._normalizeConfig(options));
  }

  _normalizeConfig(options) {
    if (typeof options === 'string') {
      return { apiKey: options };
    }
    // TODO: option: debug, noInteraction
    const { apiKey, apiHost, disableAutoAnonymousId } = options || {};
    if (!apiKey) {
      throw new Error('Require API key to initialize miso client.');
    }
    return trimObj({ apiKey, apiHost, disableAutoAnonymousId });
  }

}

Object.defineProperties(MisoClient, {
  version: { value: BUILD.version },
  instances: { value: [] },
  mods: { value: Object.assign({}, defaultMods) }
});

export default MisoClient;
