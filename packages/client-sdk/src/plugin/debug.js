const TAG = '%cMiso';
const STYLE = 'color: #fff; background-color: #334cbb; padding: 2px 2px 1px 4px;';

export class DebugPlugin {

  constructor(options = {}) {
    this._options = options;
    this.id = 'std:debug';
    this.name = 'debug';

    this._log = console.log.bind(console, TAG, STYLE);
  }

  install(_, pluginContext) {
    if (pluginContext.contains(this)) {
      // There are many ways to turn this on and it's normal to have multiple invocations.
      // console.warn('Debug plugin already installed.');
      return;
    }
    // TODO: log clients init
    // TODO: log client create
    this._injectComponent(pluginContext.classes.Component);
  }

  _injectComponent(Component) {
    const plugin = this;
    const _init = Component.prototype.init;
    Object.assign(Component.prototype, {
      init: function() {
        _init.apply(this, arguments);
        this._events.on('*', (data, meta) => plugin._handleEvent(this, meta, data));
      },
    });
  }

  _handleEvent(component, { name }, data) {
    const path = this._getPath(component);
    this._log(`[${path.join('.')}]`, name, [data]);
  }

  _getPath(component) {
    const path = [];
    for (let c = component; c; c = c._parent) {
      c._type && path.push(c._type)
    }
    return path.reverse();
  }

}

export default function debug(options) {
  return new DebugPlugin(options);
}
