import { delegateGetters, defineValues, Registry, Resolution, Resources } from '@miso.ai/commons';
import classes from '../classes.js';
import AnonymousPlugin from './anonymous.js';
import { getPluginScriptUrl } from './urls.js';

export default class PluginRoot extends Registry {

  constructor(root) {
    super('plugins', root, {
      libName: 'plugin class',
      keyName: 'id',
    });
    this._root = root;
    this._currentScript = document.currentScript;
    this._events._replays.add('install').add('subtree');
    this._installed = {};
    this._installedResolutions = {};
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

  async install(plugin, options) {
    this.use(plugin, options);
    if (typeof plugin === 'string' && !this.isRegistered(plugin)) {
      await this._tryRegisterRemotely(plugin);
    }
    return this.whenInstalled(plugin);
  }

  async whenInstalled(id) {
    if (typeof id === 'function' && id.id && typeof id.id === 'string') {
      id = id.id;
    }
    if (this.isInstalled(id)) {
      return this.get(id);
    }
    const { promise } = this._installedResolutions[id] || (this._installedResolutions[id] = new Resolution());
    return promise;
  }

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

  addUrlPass(pass) {
    if (typeof pass !== 'function') {
      throw new Error(`Expect parameter to be a function: ${pass}`);
    }
    this._root._urlPasses.push(pass);
  }

  setCustomFetch(fetch) {
    if (typeof fetch !== 'function') {
      throw new Error(`Expect parameter to be a function: ${fetch}`);
    }
    this._root._customFetch = fetch;
  }

  setCustomSendBeacon(sendBeacon) {
    if (typeof sendBeacon !== 'function') {
      throw new Error(`Expect parameter to be a function: ${sendBeacon}`);
    }
    this._root._customSendBeacon = sendBeacon;
  }

  _tryConfig(instance, options) {
    if (options === undefined) {
      return;
    }
    if (typeof instance.config === 'function') {
      instance.config(options);
      this._events.emit('config', [instance, options]);
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
      if (this._installedResolutions[instance.id]) {
        this._installedResolutions[instance.id].resolve(instance);
        delete this._installedResolutions[instance.id];
      }
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

  async _tryRegisterRemotely(id) {
    if (id.startsWith('std:')) {
      try {
        await this._registerStdRemotely(id);
        return;
      } catch(e) {
        console.error(e);
      }
    }
    // TODO: try as URL
    throw new Error(`Cannot register plugin remotely: ${id}`);
  }

  async _registerStdRemotely(id) {
    const { version } = this._root;
    const request = version === 'dev' ? `plugin:${id}@dev:${this.MisoClient.uuid}` : `plugin:${id}@${version}`;

    // check if such script already exists
    if (!document.querySelector(`script[data-request="${request}"]`)) {
      // skip if already exists
      const script = document.createElement('script');
      script.async = true;
      script.src = getPluginScriptUrl(id, version, this._currentScript);
      script.setAttribute('data-request', request);
      document.head.appendChild(script);
      // TODO: hook up error event
    }

    // TODO: fine tune
    const Plugin = await new Resources().get(request);
    !this.isRegistered(id) && this.register(Plugin);
  }

}

/**
 * The interface of extended features only for plugin developers.
 */
class PluginContext {

  constructor(root, classes) {
    delegateGetters(this, root, ['getPluginClass', 'addSubtree', 'addPayloadPass', 'addUrlPass', 'setCustomFetch', 'setCustomSendBeacon', 'whenInstalled', 'whenRegistered']);
    defineValues(this, { classes });
  }

}

/**
 * The interface of plugin features exposed to MisoClient.
 */
 class Plugins {

  constructor(root) {
    delegateGetters(this, root, ['installed', 'registered', 'isInstalled', 'isRegistered', 'whenInstalled', 'whenRegistered', 'get', 'register', 'use', 'install']);
  }

}
