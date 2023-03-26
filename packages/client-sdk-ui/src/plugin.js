import { Component, defineAndUpgrade, delegateGetters, defineValues } from '@miso.ai/commons';
import Layouts from './layouts';
import { UnitsContext } from './recommendation';
import Search from './search';
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
      if (LayoutClass.role) {
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
    defineValues(client, {
      ui: new Ui(this, client, context),
    });
  }

}

class Ui {

  constructor(plugin, client, context) {
    defineValues(this, {
      recommendation: context.interface,
      search: new Search(plugin, client),
    });
  }

}