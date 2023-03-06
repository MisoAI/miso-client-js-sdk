import { Component, defineAndUpgrade, delegateGetters } from '@miso.ai/commons';
import Layouts from './layouts';
import UnitsContext from './units';
import * as elements from './element';
import * as layouts from './layout';

const PLUGIN_ID = 'std:ui';

export default class UiPlugin extends Component {

  static get id() {
    return PLUGIN_ID;
  }

  constructor() {
    super('ui');
    this.layouts = new Layouts(this);
    this._contexts = new WeakMap();
  }

  install(MisoClient, context) {
    context.addSubtree(this);
    MisoClient.on('create', this._injectClient.bind(this));

    // layouts
    delegateGetters(MisoClient, this, ['layouts']);
    for (const LayoutClass of Object.values(layouts)) {
      if (LayoutClass.type) {
        this.layouts.register(LayoutClass);
      }
    }

    // custom elements
    for (const elementClass of Object.values(elements)) {
      defineAndUpgrade(elementClass);
    }
  }

  _injectClient(client) {
    const context = new UnitsContext(this, client);
    this._contexts.set(client, context);
    client.units = context.interface;
  }

}
