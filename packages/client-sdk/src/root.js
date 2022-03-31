import { delegateGetters, Component } from '@miso.ai/commons';
import { BUILD } from './constants';
import PluginRoot from './plugin/plugin-root';

/**
 * The hidden singleton root component that oversees all client components.
 */
class Root extends Component {

  constructor() {
    super({ event: { replay: ['create'] } });
    this.version = BUILD.version;
    this._pluginRoot = new PluginRoot(this);
    this._clients = [];
    _instance = this;
  }

  push(client) {
    this._clients.push(client);
    this._events.emit('create', client);
  }

  get instances() {
    return [ ...this._clients]; // write protection
  }

  _inject(MisoClient) {
    const pluginRoot = this._pluginRoot;
    this.MisoClient = pluginRoot.MisoClient = MisoClient;
    delegateGetters(MisoClient, this, ['version', 'instances', 'meta', 'on', 'once']);
    delegateGetters(MisoClient, pluginRoot, ['plugins']);
  }

}

let _instance;

export function get() {
  return _instance;
}

export function init(MisoClient) {
  (new Root())._inject(MisoClient);
  return MisoClient;
}
