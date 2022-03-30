import { delegateGetters, EventEmitter } from '@miso.ai/commons';
import { BUILD } from './constants';
import PluginImpl from './plugin/plugins';

/**
 * This is the singleton boss component that oversees all client components.
 */
class MisoClients {

  constructor() {
    this._events = new EventEmitter({
      error: this._error.bind(this),
      replay: ['create']
    });
    this.version = BUILD.version;
    this.pluginsImpl = new PluginImpl(this);
    this.instances = [];
  }

  push(client) {
    this.instances.push(client);
    this._events.emit('create', client);
  }

  inject(MisoClient) {
    this.MisoClient = this.pluginsImpl.MisoClient = MisoClient;
    // TODO: delegate frozen arrays for instances, plugins
    delegateGetters(MisoClient, this, ['version', 'instances']);
    delegateGetters(MisoClient, this.pluginsImpl, ['use']);
    this._events._injectSubscribeInterface(MisoClient);
    // TODO
    Object.defineProperty(MisoClient, 'plugins', {
      get: () => this.pluginsImpl.installed
    });
  }

  _error(e) {
    console.error(e);
  }

}

export default new MisoClients();
