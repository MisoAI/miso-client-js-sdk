const ID = 'std:debug';

export default class DebugPlugin {

  constructor(options = {}) {
    this._options = options;
  }

  static get id() {
    return ID;
  }

  install(MisoClient) {
    this._injectComponents(MisoClient);
    MisoClient.debug = (...args) => this._logr(...args);
  }

  config(options = {}) {
    this._options = {
      ...this._options,
      ...options,
    }
  }

  _injectComponents(component, treePath = []) {
    component.on('child', (c) => this._injectComponents(c, treePath));
    component.on('subtree', (c) => this._injectComponents(c, treePath.concat(component.meta.path)));
    component.on('*', (data, meta) => this._handleEvent(component, meta, data, treePath));
  }

  _handleEvent(component, { name }, data, treePath = []) {
    if (name === 'child' || name === 'subtree') {
      return;
    }
    const path = treePath.concat(component.meta.path);
    if (!path.length) {
      switch (name) {
        case 'create':
          this._handleCreateClient(name, data);
          return;
      }
    }
    switch (path[0]) {
      case 'client':
        switch (path[1]) {
          case 'api':
            this._handleApiEvent(name, { ...data, groupName: path[2] });
            return;
        }
        break;
      case 'plugins':
        if (path.length === 1) {
          this._handlePluginsEvent(name, data);
        } else {
          this._handlePluginSpecificEvent(path[1], path.slice(2), name, data);
        }
        return;
    }
    this._logw(path.join('.'), name, data);
  }

  _handleCreateClient(eventName, data) {
    this._logw('client', eventName, data);
  }

  _handleApiEvent(eventName, { groupName, apiName, url, bulk, ...data }) {
    const pathname = new URL(url).pathname;
    const args = ['api', eventName];

    bulk && args.push(`(bulk ${bulk.bulkId})`);

    args.push(`POST ${pathname}`);

    if (groupName === 'interactions') {
      // TODO: handle multiple interactions
      const record = data.payload.data[0];
      const { type, context: { custom_context = {} } = {} } = record;
      const { property } = custom_context;
      args.push(property ? `${type} (${property})` : `${type}`);
    }

    args.push([{ ...data, url }]);

    this._log(...args);
  }

  _handlePluginsEvent(eventName, plugin) {
    let data = [];
    if (Array.isArray(plugin)) {
      data = plugin.slice(1);
      plugin = plugin[0];
    }
    this._log('plugins', eventName, `${plugin.id || '(anonymous)'}`, [plugin, ...data]);
  }

  _handlePluginSpecificEvent(pluginId, path, name, data) {
    this._logw([pluginId, path.join('.')], name, data);
  }

  _getPath(component) {
    const path = [];
    for (let c = component; c; c = c.meta.parent) {
      c.meta.name && path.push(c.meta.name)
    }
    return path.reverse();
  }

  _logr(...data) {
    const options = this._options.console || {};
    console.log(_tag(options), _style(options), ...data);
  }

  _log(path, name, ...data) {
    const options = this._options.console || {};
    console.log(_tag(options), _style(options), _path(path), _name(name), ...data);
  }

  _logw(path, name, data) {
    if (data === undefined) {
      this._log(path, name);
    } else if (Array.isArray(data)) {
      this._log(path, name, ...data.map(_wrapObj));
    } else {
      this._log(path, name, _wrapObj(data));
    }
  }

}

function _tag({ text = 'Miso' } = {}) {
  return `%c${text}`;
}

function _style({ color = '#fff', background = '#334cbb' } = {}) {
  return `color: ${color}; background-color: ${background}; padding: 2px 2px 1px 4px;`;
}

// format path
function _path(path) {
  return `<${typeof path === 'string' ? path : path.filter(v => v).join('/')}>`;
}

// format event name
function _name(name) {
  return `[${name}]`;
}

function _wrapObj(value) {
  const type = typeof value;
  return type === 'function' || (type === 'object' && !Array.isArray(value)) ? [value] : value;
}
