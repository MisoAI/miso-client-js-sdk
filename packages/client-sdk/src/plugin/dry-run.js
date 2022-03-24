export class DryRunPlugin {

  constructor(options = {}) {
    this._options = options;
    this.id = 'std:dry-run';
    this.name = 'dry-run';
  }

  install(_, pluginContext) {
    if (pluginContext.contains(this)) {
      console.warn('DryRun plugin already installed.');
      return;
    }
    const self = this;
    pluginContext.classes.api.ApiBase.prototype._send = async function({ url }) {
      this._events.emit('dry-run-send', url);
      return self._mockResponse();
    }
  }

  _mockResponse() {
    // TODO: take api type
    return {
      data: {
        products: [],
        attributes: [],
        completions: {},
      }
    }
  }

  _log(name, data) {
    const args = [TAG, STYLE, `[${name}]`].concat(data);
    console.log.apply(console, args);
  }

}

export default function dryRun(options) {
  return new DryRunPlugin(options);
}
