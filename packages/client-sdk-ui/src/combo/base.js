import { Component } from '@miso.ai/commons';

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

  set element(element) {
    this._element = element;
  }

  start() {
    if (this._started) {
      return;
    }
    this._started = true;
    this._start();
  }

  _start() {
    throw new Error('Unimplemented');
  }

}
