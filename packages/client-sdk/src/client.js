import { trimObj, executeWithCatch } from './util/objects';
import Component from './util/component';
import clients from './clients';
import Api from './api';
import Context from './context';

class MisoClient extends Component {

  constructor(options) {
    super('client');
    this._config(options);

    this.context = new Context(this);
    this.api = new Api(this);

    clients.push(this);
  }

  get version() {
    return MisoClient.version;
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

  debug() {
    MisoClient.debug.apply(MisoClient, arguments);
  }

  _error(e) {
    console.error(e);
  }

}

clients.inject(MisoClient);
MisoClient.debug = () => {};

export default MisoClient;
