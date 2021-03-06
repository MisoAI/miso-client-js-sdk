const TAG = '%cMiso';
const STYLE = 'color: #fff; background-color: #334cbb; padding: 2px 2px 1px 4px;';

const ID = 'std:debug';

const _log = (path, name, ...data) => console.log(TAG, STYLE, _path(path), _name(name), ...data);

function _logw(path, name, data) {
  if (data === undefined) {
    _log(path, name);
  } else if (Array.isArray(data)) {
    _log(path, name, ...data.map(_wrapObj));
  } else {
    _log(path, name, _wrapObj(data));
  }
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

export default class DebugPlugin {

  constructor() {
    this._log = console.log.bind(console, TAG, STYLE);
  }

  static get id() {
    return ID;
  }

  // TODO: config({ active })

  install(MisoClient) {
    this._injectComponents(MisoClient);
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
    _logw(path.join('.'), name, data);
  }

  _handleCreateClient(eventName, data) {
    _logw('client', eventName, data);
  }

  _handleApiEvent(eventName, { groupName, apiName, url, bulk, ...data }) {
    const pathname = new URL(url).pathname;
    const args = ['api', eventName];

    bulk && args.push(`(bulk ${bulk.bulkId})`);

    args.push(`POST ${pathname}`);

    if (groupName === 'interactions') {
      // TODO: handle multiple interactions
      const { type } = data.payload.data[0];
      args.push(type);
    }

    args.push([{ ...data, url }]);

    _log.apply(undefined, args);
  }

  _handlePluginsEvent(eventName, plugin) {
    _log('plugins', eventName, `${plugin.id || '(anonymous)'}`, [plugin]);
  }

  _handlePluginSpecificEvent(pluginId, path, name, data) {
    _logw([pluginId, path.join('.')], name, data);
  }

  _getPath(component) {
    const path = [];
    for (let c = component; c; c = c.meta.parent) {
      c.meta.name && path.push(c.meta.name)
    }
    return path.reverse();
  }

}
