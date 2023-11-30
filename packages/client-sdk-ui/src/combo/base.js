import { Component, Resolution } from '@miso.ai/commons';

export default class Combo extends Component {
  
  constructor({
    name,
    plugin,
    MisoClient,
    ...options
  }) {
    super(name || 'combo', plugin);
    this._name = name;
    this._plugin = plugin;
    this._MisoClient = MisoClient;
    this._options = options;
  }

  get MisoClient() {
    return this._MisoClient;
  }

  get element() {
    return this._element;
  }

  async waitForElement() {
    return this._element || (this._elementRes || (this._elementRes = new Resolution())).promise;
  }

  set element(element) {
    // TODO: guard against multiple element assignment
    this._element = element;
    this._elementRes && this._elementRes.resolve(element);
  }

  start(options) {
    if (this._started) {
      return;
    }
    this._started = true;
    if (options) {
      this.config(options);
    }
    this._start();
  }

  _start() {
    throw new Error('Unimplemented');
  }

}
