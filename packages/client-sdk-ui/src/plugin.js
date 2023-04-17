import { Component, defineAndUpgrade, delegateGetters, defineValues } from '@miso.ai/commons';
import { Ask, Search, RecommendationContext } from './workflow';
import Layouts from './layouts';
import * as elements from './element';
import * as layouts from './layout';
import * as sources from './source';

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
    const { containers, roles, ...others } = elements;
    for (const elementClass of Object.values(containers)) {
      defineAndUpgrade(elementClass);
    }
    for (const elementClass of Object.values(roles)) {
      defineAndUpgrade(elementClass);
    }
    for (const elementClass of Object.values(others)) {
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
      sources: {
        api: sources.api(client),
      }
    });
  }

}