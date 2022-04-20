import { trimObj, Component } from '@miso.ai/commons';
import { root, register } from './root';
import Api from './api';
import Context from './context';

class MisoClient extends Component {

  constructor(options) {
    super('client', root);
    this._config(options);

    this.context = new Context(this);
    this.api = new Api(this);

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
    if (!options.apiKey) {
      throw new Error('Require API key to initialize miso client.');
    }
    return trimObj(options);
  }

}

export default MisoClient;
