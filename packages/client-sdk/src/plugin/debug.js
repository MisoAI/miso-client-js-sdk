const TAG = '%cMiso';
const STYLE = 'color: #fff; background-color: #334cbb; padding: 2px 2px 1px 4px;';

export class DebugPlugin {

  constructor(options = {}) {
    this._options = options;
    this.id = 'std:debug';
    this.name = 'debug';

    this._log = console.log.bind(console, TAG, STYLE);
  }

  install(plugins) {
    if (plugins.contains(this)) {
      // There are many ways to turn this on and it's normal to have multiple invocations.
      // console.warn('Debug plugin already installed.');
      return;
    }
    // TODO: log clients init
    // TODO: log client create
    this._injectComponent(plugins.classes.Component);
  }

  _injectComponent(Component) {
    const self = this;
    Component.on('create', (component) => {
      component.on('*', (data, meta) => self._handleEvent(component, meta, data));
    });
  }

  _handleEvent(component, { name }, data) {
    const path = this._getPath(component);
    const pathStr = path.join('.');
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
    this._log(`[${pathStr}]`, name, [data]);
  }

  _handleApiEvent(eventName, { apiName, url, ...data }) {
    const pathname = new URL(url).pathname;
    this._log(`[api.${eventName}]`, `POST ${pathname}`, [{ ...data, url }]);
  }

  _handlePluginsEvent(eventName, data) {
    this._log(`[plugin:${data.name || data.id || '(anonymous)'}]`, `${eventName}`, [data]);
  }

  _getPath(component) {
    const path = [];
    for (let c = component; c; c = c._parent) {
      c._name && path.push(c._name)
    }
    return path.reverse();
  }

}

export default function debug(options) {
  return new DebugPlugin(options);
}
