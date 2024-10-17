import { trimObj, Component, uuidv4, defineValues } from '@miso.ai/commons';
import { root, register, init } from './root';
import { Api } from './api/index.js';
import Context from './context';
import * as helpers from './utils';

const { currentScript } = document;

class MisoClient extends Component {

  static attach() {
    (window.MisoClients || (window.MisoClients = [])).push(MisoClient);
    if (window.MisoClient) {
      if (window.MisoClient !== MisoClient) {
        // TODO: check version as well
        console.warn(`window.MisoClient already exists: (${window.MisoClient.version}).`);
      }
      return;
    }
    window.MisoClient = MisoClient;
  }

  // nop, will be replaced by DebugPlugin
  static debug() {}

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
    const url = currentScript.src || currentScript.href; // might be <link> as well
    const params = new URL(new Request(url).url).searchParams;
    return trimObj({
      apiKey: params.get('api_key') || undefined,
    });
  }

}

MisoClient.helpers = helpers;

defineValues(MisoClient, {
  uuid: uuidv4(),
});

export default init(MisoClient);
