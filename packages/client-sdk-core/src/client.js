import { trimObj, Component } from '@miso.ai/commons';
import { root, register } from './root';
import Api from './api';
import Context from './context';

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

  _normalizeOptions({ readConfigFromScriptUrl = false, ...options } = {}) {
    if (typeof options === 'string') {
      options = { apiKey: options };
    }
    if (readConfigFromScriptUrl) {
      options = {
        ...this._readConfigFromScriptUrl(),
        ...options,
      };
    }
    if (!options.apiKey) {
      throw new Error('Require API key to initialize miso client.');
    }
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

export default MisoClient;
