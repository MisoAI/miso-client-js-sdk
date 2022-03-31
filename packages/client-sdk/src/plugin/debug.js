const TAG = '%cMiso';
const STYLE = 'color: #fff; background-color: #334cbb; padding: 2px 2px 1px 4px;';

const ID = 'std:debug';

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

  _injectComponents(component) {
    component.on('child', (c) => this._injectComponents(c));
    component.on('*', (data, meta) => this._handleEvent(component, meta, data));
  }

  _handleEvent(component, { name }, data) {
    if (name === 'child') {
      return;
    }
    const path = component.meta.path;
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
            this._handleApiEvent(name, data);
            return;
        }
        break;
      case 'plugins':
        this._handlePluginsEvent(name, data);
        return;
    }
    this._log(`[${path.join('.')}]`, name, [data]);
  }

  _handleCreateClient(eventName, data) {
    this._log(`[client.${eventName}]`, [data]);
  }

  _handleApiEvent(eventName, { apiName, url, ...data }) {
    const pathname = new URL(url).pathname;
    this._log(`[api.${eventName}]`, `POST ${pathname}`, [{ ...data, url }]);
  }

  _handlePluginsEvent(eventName, plugin) {
    this._log(`[plugin.${eventName}]`, `${plugin.id || '(anonymous)'}`, [plugin]);
  }

  _getPath(component) {
    const path = [];
    for (let c = component; c; c = c.meta.parent) {
      c.meta.name && path.push(c.meta.name)
    }
    return path.reverse();
  }

}
