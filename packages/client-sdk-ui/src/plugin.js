import { Component, defineAndUpgrade, delegateGetters, defineValues } from '@miso.ai/commons';
import { Ask, Search, RecommendationContext } from './coordinator';
import Layouts from './layouts';
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
    this._recommendationContexts = new WeakMap();
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
    const context = new RecommendationContext(this, client);
    this._recommendationContexts.set(client, context);
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
      ask: new Ask(plugin, client),
    });
  }

}