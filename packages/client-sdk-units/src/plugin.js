import { Component, defineAndUpgrade, delegateGetters } from '@miso.ai/commons';
import Widgets from './widgets';
import UnitsContext from './units';
import * as elements from './element';
import * as widgets from './widget';

const PLUGIN_ID = 'std:units';

export default class UnitsPlugin extends Component {

  static get id() {
    return PLUGIN_ID;
  }

  constructor() {
    super('units');
    this.widgets = new Widgets(this);
    this._contexts = new WeakMap();
  }

  install(MisoClient, context) {
    context.addSubtree(this);
    MisoClient.on('create', this._injectClient.bind(this));

    // widgets
    delegateGetters(MisoClient, this, ['widgets']);
    for (const WidgetClass of Object.values(widgets)) {
      if (WidgetClass.type) {
        this.widgets.register(WidgetClass);
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
