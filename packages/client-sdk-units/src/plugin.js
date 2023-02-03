import { Component } from '@miso.ai/commons';
import UnitsContext from './units';

const PLUGIN_ID = 'std:units';

export default class UnitsPlugin extends Component {

  static get id() {
    return PLUGIN_ID;
  }

  constructor() {
    super('units');
    this._contexts = new WeakMap();
  }

  install(MisoClient, context) {
    context.addSubtree(this);
    MisoClient.on('create', this._injectClient.bind(this));
  }

  _injectClient(client) {
    const context = new UnitsContext(this, client);
    this._contexts.set(client, context);
    client.units = context.interface;
  }

}
