const ID = 'std:dry-run';

export default class DryRunPlugin {

  constructor(options = {}) {
    this._options = options;
    this.id = 'std:dry-run';
    this.name = 'dry-run';
  }

  static get id() {
    return ID;
  }

  // TODO: config({ active })

  install(_, context) {
    const self = this;
    context.classes.api.ApiBase.prototype._send = async function({ url }) {
      this._events.emit('dry-run-send', { url });
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

}
