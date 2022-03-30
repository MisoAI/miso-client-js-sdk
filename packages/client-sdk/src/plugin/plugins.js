import { delegateGetters, Component } from '@miso.ai/commons';
import libraries from './libraries';
import classes from './classes';
import SimplePlugin from './simple';

export default class PluginImpl extends Component {

  constructor() {
    super('plugins', { events: { replay: ['install'] }});
    this.libraries = libraries;
    this.classes = classes;
    this.installed = [];
    this.plugins = new Plugins(this);
  }

  use(plugin, options) {
    if (typeof plugin === 'string') {
      const pluginLib = this.libraries[plugin];
      if (!pluginLib) {
        throw new Error(`Plugin not found: ${plugin}`);
      }
      this._use(pluginLib(options));
    } else {
      this._use(plugin);
    }
  }

  _use(plugin) {
    // TODO: make comprehensive install lifecycle: install, reconfig, uninstall
    const name = plugin && plugin.name || '(anonymous)';
    if (typeof plugin === 'function') {
      plugin = new SimplePlugin(name, plugin);
    }
    if (typeof plugin.install !== 'function') {
      // TODO: introduce PluginError
      throw new Error(`Expect either plugin.install or plugin be a function: ${name}`);
    }
    this._install(plugin);
  }

  _install(plugin) {
    try {
      plugin.install(this.plugins);
    } catch(e) {
      // TODO: introduce PluginError
      throw e;
    }
    this.installed.push(plugin);
    this._events.emit('install', { id: plugin.id, name: plugin.name });
  }

}

class Plugins {

  constructor(pluginImpl) {
    delegateGetters(this, pluginImpl, ['MisoClient', 'classes', 'installed']);
  }

  contains(plugin) {
    const id = typeof plugin === 'string' ? plugin : plugin.id;
    // TODO: check id
    return id && this.installed.some((p) => p.id === id);
  }

}
