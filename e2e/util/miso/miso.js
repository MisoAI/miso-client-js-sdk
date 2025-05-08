import Workflows from './workflows.js';

export async function createMisoProxy(page, options = {}) {
  return new Miso(page, options)._init();
}

class Miso {

  constructor(page, options = {}) {
    this._page = page;
    this._options = options;
    this._workflows = new Workflows(this);
  }

  get workflows() {
    return this._workflows;
  }

  async _init() {
    await this._page.exposeFunction('_pw', this._handleEvent.bind(this));
    return this;
  }

  _handleEvent(name, event) {
    switch (name) {
      case 'MisoClient':
      case 'client':
        return true;
    }
    return this._workflows._handleEvent(name, event) || this._handleUnknownEvent(name, event);
  }

  _handleUnknownEvent(name, event) {
    console.log(`Unknown event "${name}" (miso)`, event);
    return true;
  }

}
