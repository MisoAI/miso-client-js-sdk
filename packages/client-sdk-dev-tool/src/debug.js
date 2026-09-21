import { Logs } from './logs.js';

const ID = 'std:debug';

// the item subworkflow contexts emit per item (one workflow per thread of
// the list, per message of the conversation), which floods the console.
// Muted paths stay out of the console only: they are still preserved for
// the log dump. Configurable via the `mute` option (`mute: []` shows all)
const DEFAULT_MUTE = Object.freeze(['workflow/thread-items', 'workflow/message-items']);

export default class DebugPlugin {

  constructor(options = {}) {
    this._options = options;
    this._logs = new Logs(options);
  }

  static get id() {
    return ID;
  }

  install(MisoClient) {
    this._injectComponents(MisoClient);
    MisoClient.debug = (...args) => this._logr(...args);
    MisoClient.logs = this._logs;
  }

  config(options = {}) {
    this._options = {
      ...this._options,
      ...options,
    }
    this._logs.config(options);
    if (options.preserveLog) {
      this._log(ID, 'ua', window.navigator.userAgent);
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
        if (path.length === 1 && (name === 'workflow' || name === 'postworkflow')) {
          this._handleClientWorkflowEvent(name, data);
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

    // the api helpers' fetch defaults to POST when no method is specified
    const { method = 'POST' } = data.options || {};
    args.push(`${method} ${pathname}`);

    if (groupName === 'interactions') {
      // TODO: handle multiple interactions
      const record = data.payload.data[0];
      const { type, custom_action_name, context: { custom_context: { property } = {} } = {} } = record;
      const name = type === 'custom' && custom_action_name ? `${type}:${custom_action_name}` : type;
      args.push(property ? `${name} (${property})` : `${name}`);
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

  // a workflow's creation events on the client follow its context: the
  // workflows of a muted context (the item subworkflows) are muted as well
  _handleClientWorkflowEvent(name, workflow) {
    const context = workflow && workflow._context;
    const silent = !!context && this._isMuted(_joinPath(_pluginComponentPath(context.meta.path)));
    this._logw('client', name, workflow, { silent });
  }

  _handlePluginSpecificEvent(pluginId, path, name, data) {
    this._logw(_pluginComponentPath([pluginId, ...path]), name, data);
  }

  _getPath(component) {
    const path = [];
    for (let c = component; c; c = c.meta.parent) {
      c.meta.name && path.push(c.meta.name)
    }
    return path.reverse();
  }

  _logw(path, name, data, options) {
    if (data === undefined) {
      data = [];
    } else if (Array.isArray(data)) {
      data = data.map(_wrapObj);
    } else {
      data = [_wrapObj(data)];
    }
    this._logp(path, name, data, options);
  }

  _log(path, name, ...data) {
    this._logp(path, name, data);
  }

  _logp(path, name, data, { silent = false } = {}) {
    path = _joinPath(path);
    this._write([_path(path), _name(name), ...data], { silent: silent || this._isMuted(path) });
  }

  _logr(...data) {
    this._write(data);
  }

  _write(data, { silent = false } = {}) {
    const options = this._options.console || {};
    if (this._options.preserveLog) {
      this._logs._logs.push(data);
    }
    if (silent) {
      return;
    }
    console.log(_tag(options), _style(options), ...data);
  }

  _isMuted(path) {
    const { mute = DEFAULT_MUTE } = this._options;
    return mute.includes(path);
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
  return `<${path}>`;
}

// the log path of a component under a plugin, off its meta path — which
// starts at the plugin ([pluginId, ...rest]): the plugins root reaches the
// plugins as subtrees, not as parents
function _pluginComponentPath(path) {
  return [path[0], path.slice(1).join('.')];
}

function _joinPath(path) {
  return typeof path === 'string' ? path : path.filter(v => v).join('/');
}

// format event name
function _name(name) {
  return `[${name}]`;
}

function _wrapObj(value) {
  const type = typeof value;
  return type === 'function' || (type === 'object' && !Array.isArray(value)) ? [value] : value;
}
