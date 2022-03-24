const TAG = '%cMiso';
const STYLE = 'color: #fff; background-color: #334cbb; padding: 2px 2px 1px 4px;';

export class DebugPlugin {

  constructor(options = {}) {
    this._options = options;
    this.id = 'std:debug';
    this.name = 'debug';
  }

  install(MisoClient, pluginContext) {
    for (const plugin of MisoClient.plugins) {
      if (plugin.id === this.id) {
        console.warn('Debug plugin already installed.');
        return;
      }
    }
    // TODO: log client create
    const _log = this._log.bind(this);
    const _debug = MisoClient.debug;
    MisoClient.debug = function(name, ...data) {
      _debug.apply(this, arguments);
      _log(name, data);
    };
  }

  _log(name, data) {
    const args = [TAG, STYLE, `[${name}]`].concat(data);
    console.log.apply(console, args);
  }

}

export default function debug(options) {
  return new DebugPlugin(options);
}
