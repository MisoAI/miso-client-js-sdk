import { delegateGetters, defineValues, Component } from '@miso.ai/commons';
import classes from './classes';
import AnonymousPlugin from './anonymous';

export default class PluginRoot extends Component {

  constructor(root) {
    super('plugins', root, { event: { replay: ['register', 'install'] }});
    this._libraries = {};
    this._installed = {};
    this.context = new PluginContext(this, classes);
    this.plugins = new Plugins(this);
  }

  isInstalled(id) {
    this._checkId(id);
    return this._installed[id];
  }

  get installed() {
    return Object.values(this._installed);
  }

  isRegistered(id) {
    this._checkId(id);
    return this._libraries[id];
  }

  get registered() {
    return Object.values(this._libraries);
  }

  get(id) {
    return this._installed[id];
  }

  getPluginClass(id) {
    return this._libraries[id];
  }

  register(...pluginClasses) {
    for (const pluginClass of pluginClasses) {
      this._register(pluginClass);
    }
  }

  _register(pluginClass) {
    const id = pluginClass.id;
    if (typeof id !== 'string' || !id) {
      throw new Error(`Expect a string "id" property on plugin class: ${pluginClass}`);
    }
    if (this.isRegistered(id)) {
      // TODO: warn and overwrite?
    }
    this._checkPluginClass(pluginClass);
    this._libraries[id] = pluginClass;
    this._events.emit('register', pluginClass);
  }

  use(plugin, options) {
    let instance;
    if (typeof plugin === 'string' && this.isInstalled(plugin)) {
      // already installed, run config() instead
      instance = this.get(id);
      this._tryConfig(instance, options);
      return instance;
    }
    instance = this._instantiate(plugin, options);
    this._install(instance);
    return instance;
  }

  // TODO: unuse()

  _tryConfig(instance, options) {
    if (options === undefined) {
      return;
    }
    if (typeof instance.config === 'function') {
      instance.config(options);
    } else {
      this._warn(`Attempt to pass options to plugin "${instance.id}", which offers no config() method.`);
    }
  }

  _instantiate(plugin, options) {
    switch (typeof plugin) {
      case 'string':
        this._checkId(plugin);
        const pluginClass = this._libraries[plugin];
        if (!pluginClass) {
          throw new Error(`Plugin class not found: ${plugin}`);
        }
        const instance = new pluginClass();
        defineValues(instance, { id: plugin });
        this._tryConfig(instance, options);
        return instance;
      case 'function':
        return new AnonymousPlugin(plugin);
    }
    throw new Error(`Unexpected parameters: ${plugin}`);
  }

  _install(instance) {
    if (typeof instance.install !== 'function') {
      // TODO: introduce PluginError
      throw new Error(`Expect plugin.install to be a function: ${instance}`);
    }
    try {
      instance.installed = false;
      instance.install(this.MisoClient, this.context);
      instance.installed = true;
    } catch(e) {
      // TODO: introduce PluginError
      throw e;
    }
    this._installed[instance.id] = instance;
    this._events.emit('install', instance);
  }

  _checkId(id) {
    if (typeof id !== 'string' || !id) {
      throw new Error(`Expect plugin id to be a non-empty string: ${id}`);
    }
  }

  _checkPluginClass(pluginClass) {
    if (typeof pluginClass !== 'function') {
      throw new Error(`Expect plugin class to be a function: ${pluginClass}`);
    }
  }

}

/**
 * The interface of extended features only for plugin developers.
 */
class PluginContext {

  constructor(root, classes) {
    delegateGetters(this, root, ['getPluginClass']);
    defineValues(this, { classes });
  }

}

/**
 * The interface of plugin features exposed to MisoClient.
 */
 class Plugins {

  constructor(root) {
    delegateGetters(this, root, ['installed', 'registered', 'isInstalled', 'isRegistered', 'get', 'register', 'use']);
  }

}
