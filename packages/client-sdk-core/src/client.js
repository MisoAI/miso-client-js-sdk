import { trimObj, Component } from '@miso.ai/commons';
import { root, register } from './root';
import Api from './api';
import Context from './context';
import * as helpers from './utils';

class MisoClient extends Component {

  constructor(options) {
    super('client', root);
    this._config(options);

    this.context = new Context(this);
    this.api = new Api(this, root);

    register(this);
  }

  get version() {
    return MisoClient.version;
  }

  _config(options) {
    this.options = Object.freeze(this._normalizeOptions(options));
  }

  _normalizeOptions(options = {}) {
    if (typeof options === 'string') {
      options = { apiKey: options };
    }
    if (options.readConfigFromScriptUrl) {
      options = {
        ...this._readConfigFromScriptUrl(),
        ...options,
      };
    }
    if (!options.apiKey) {
      throw new Error('Require API key to initialize miso client.');
    }

    options.dataEndpoint = options.dataEndpoint || options.apiHost;
    options.eventEndpoint = options.eventEndpoint || options.apiHost;
    delete options.apiHost;

    return trimObj(options);
  }

  _readConfigFromScriptUrl() {
    const me = document.currentScript;
    const url = me.src || me.href; // might be <link> as well
    const params = new URL(new Request(url).url).searchParams;
    return trimObj({
      apiKey: params.get('api_key') || undefined,
    });
  }

}

MisoClient.helpers = helpers;

export default MisoClient;
