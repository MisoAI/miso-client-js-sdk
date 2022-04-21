import { delegateGetters, Component } from '@miso.ai/commons';
import version from './version';
import PluginRoot from './plugin/plugin-root';

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
    this.version = version || 'dev';
  }

  get instances() {
    return [ ...this._clients]; // write protection
  }

}

export const root = new Root();

export function init(MisoClient) {
  const pluginRoot = root._pluginRoot;
  root.MisoClient = pluginRoot.MisoClient = MisoClient;
  delegateGetters(MisoClient, root, ['version', 'instances', 'meta', 'on', 'once']);
  delegateGetters(MisoClient, pluginRoot, ['plugins']);
  return MisoClient;
}

export function register(client) {
  root._clients.push(client);
  root._events.emit('create', client);
}
