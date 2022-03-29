import { delegateGetters } from '@miso.ai/commons/dist/es/objects';
import { EventEmitter } from '@miso.ai/commons';
import mods from './mod';
import plugins from './plugin';
import SimplePlugin from './plugin/simple';
import { BUILD } from './constants';
import pluginContext from './plugin/context';

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
    this.instances = [];
    this.plugins = [];
    this.lib = Object.freeze({
      mods: mods,
      plugins: plugins
    });
  }

  push(client) {
    this.instances.push(client);
    this._events.emit('create', client);
  }

  use(plugin, options) {
    if (typeof plugin === 'string') {
      const pluginLib = this.lib.plugins[plugin];
      if (!pluginLib) {
        throw new Error(`Plugin not found: ${plugin}`);
      }
      this._use(pluginLib(options));
    } else {
      this._use(plugin);
    }
  }

  _use(plugin) {
    const name = plugin && plugin.name || '(anonymous)';
    if (typeof plugin === 'function') {
      plugin = new SimplePlugin(name, plugin);
    }
    if (typeof plugin.install !== 'function') {
      // TODO: introduce PluginError
      throw new Error(`Expect either plugin.install or plugin be a function: ${name}`);
    }
    let context = undefined;
    try {
      context = plugin.install(this.MisoClient, pluginContext);
    } catch(e) {
      // TODO: introduce PluginError
      throw e;
    }
    if (context !== undefined) {
      plugin.context = context;
    }
    pluginContext.installed.push(plugin);
  }

  inject(MisoClient) {
    this.MisoClient = MisoClient;
    // TODO: delegate frozen arrays for instances, plugins
    delegateGetters(MisoClient, this, ['version', 'instances', 'use', 'lib', 'on', 'once']);
    Object.defineProperty(MisoClient, 'plugins', {
      get: () => pluginContext.installed
    });
  }

  _error(e) {
    console.error(e);
  }

}

export default new MisoClients();
