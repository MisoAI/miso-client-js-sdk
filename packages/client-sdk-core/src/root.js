import { delegateGetters, Component } from '@miso.ai/commons';
import version from './version.js';
import PluginRoot from './plugin/plugin-root.js';

/**
 * The hidden singleton root component that oversees all client components.
 */
class Root extends Component {

  constructor() {
    super();
    this._events._replays.add('create');
    this._pluginRoot = new PluginRoot(this);
    this._clients = [];
    this._payloadPasses = [];
    this._urlPasses = [];
    this.version = version || 'dev';
  }

  get instances() {
    return [ ...this._clients]; // write protection
  }

  async any() {
    return this._clients[0] || this._any || (this._any = (await this._events.once('create')).data);
  }

}

export const root = new Root();

export function init(MisoClient) {
  const pluginRoot = root._pluginRoot;
  root.MisoClient = pluginRoot.MisoClient = MisoClient;
  delegateGetters(MisoClient, root, ['version', 'instances', 'any', 'meta', 'on', 'once']);
  delegateGetters(MisoClient, pluginRoot, ['plugins']);
  return MisoClient;
}

export function register(client) {
  root._clients.push(client);
  root._events.emit('create', client);
}
