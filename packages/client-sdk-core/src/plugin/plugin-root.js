import { delegateGetters, defineValues, Registry } from '@miso.ai/commons';
import classes from '../classes';
import AnonymousPlugin from './anonymous';

export default class PluginRoot extends Registry {

  constructor(root) {
    super('plugins', root, {
      libName: 'plugin class',
      keyName: 'id',
    });
    this._root = root;
    this._events._replays.add('install').add('subtree');
    this._installed = {};
    this._useRequests = {};
    this._subtrees = [];
    this.context = new PluginContext(this, classes);
    this.plugins = new Plugins(this);
  }

  isInstalled(id) {
    this._checkKey(id);
    return !!this._installed[id];
  }

  get installed() {
    return Object.values(this._installed);
  }

  get(id) {
    return this._installed[id];
  }

  getPluginClass(id) {
    return this._libraries[id];
  }

  // TODO: we should be able to support (Class1, Class2, options2, etc.)
  // TODO: refactor use() and _instantiate()
  use(plugin, options) {
    // use(PluginClass) is a shortcut of register() then use()
    if (typeof plugin === 'function' && plugin.id && typeof plugin.id === 'string') {
      this.register(plugin);
      this.use(plugin.id, options);
      return;
    }
    let instance;
    if (typeof plugin === 'string' && this.isInstalled(plugin)) {
      // if already installed, try to run config() instead
      instance = this.get(plugin);
      this._tryConfig(instance, options);
      return;
    }
    if (typeof plugin === 'string' && !this.isRegistered(plugin)) {
      // not registered yet, push a use request
      (this._useRequests[plugin] || (this._useRequests[plugin] = [])).push(options);
      return;
    }
    instance = this._instantiate(plugin, options);
    this._install(instance);
  }

  // TODO: unuse()

  addSubtree(component) {
    this._subtrees.push(component);
    this._events.emit('subtree', component);
  }

  addPayloadPass(pass) {
    if (typeof pass !== 'function') {
      throw new Error(`Expect parameter to be a function: ${pass}`);
    }
    this._root._payloadPasses.push(pass);
  }

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
        this._checkKey(plugin);
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
    if (instance.id) {
      // we don't track anonymous plugins
      this._installed[instance.id] = instance;
    }
    this._events.emit('install', instance);
  }

  _register(lib) {
    super._register(lib);
    this._fulfillUseRequests(lib.id);
  }

  _fulfillUseRequests(id) {
    const requests = this._useRequests[id];
    if (requests) {
      for (const options of requests) {
        try {
          this.use(id, options);
        } catch(e) {
          this._error(e);
        }
      }
      delete this._useRequests[id];
    }
  }

}

/**
 * The interface of extended features only for plugin developers.
 */
class PluginContext {

  constructor(root, classes) {
    delegateGetters(this, root, ['getPluginClass', 'addSubtree', 'addPayloadPass']);
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
