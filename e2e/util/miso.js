import Workflows from './workflows.js';

export async function createMisoProxy(page, options = {}) {
  return new Miso(page, options)._init();
}

class Miso {

  constructor(page, options = {}) {
    this._page = page;
    this._options = options;
    this._signals = {};
    this._workflows = new Workflows(this);
  }

  get workflows() {
    return this._workflows;
  }

  done(options) {
    return this.waitFor('done', options);
  }

  waitFor(name, options = {}) {
    // TODO: timeout
    return this._getSignalResolution(name).promise;
  }

  async _init() {
    await this._page.exposeFunction('_pw', this._handleCallback.bind(this));
    return this;
  }

  _handleCallback(cmd, ...args) {
    switch (cmd) {
      case 'event':
        this._handleEvent(...args);
        break;
      case 'signal':
        this._handleSignal(...args);
        break;
      default:
        console.log('Unknown callback (miso)', cmd, args);
        break;
    }
  }

  _handleEvent(event) {
    return this._workflows._handleEvent(event) || this._handleUnknownEvent(event);
  }

  _handleUnknownEvent(event) {
    console.log('Unknown event (miso)', event);
    return true;
  }

  _getSignalResolution(name) {
    let resolution = this._signals[name];
    if (!resolution) {
      resolution = this._signals[name] = {};
      resolution.promise = new Promise((resolve, reject) => {
        resolution.resolve = async (value) => {
          const message = `[Signal] ${name}`;
          value === undefined ? console.log(message) : console.log(message, value);
          resolve(value);
        };
        resolution.reject = reject;
      });
    }
    return resolution;
  }

  _handleSignal(signal, data) {
    const resolution = this._getSignalResolution(signal);
    // TODO: handle error
    resolution.resolve(data);
  }

}
