import Workflows from './workflows.js';

export async function createMisoProxy(page) {
  return new Miso(page)._init();
}

class Miso {

  constructor(page) {
    this._page = page;
    this._workflows = new Workflows(this);
  }

  get workflows() {
    return this._workflows;
  }

  async _init() {
    await this._page.exposeFunction('_pw', event => this._handleEvent(event));
    return this;
  }

  _handleEvent(event) {
    return this._workflows._handleEvent(event) || this._handleUnknownEvent(event);
  }

  _handleUnknownEvent(event) {
    console.log('Unknown event (miso)', event);
    return true;
  }

}
