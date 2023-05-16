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
    this._extensions = new WeakMap();
  }

  install(MisoClient, context) {
    context.addSubtree(this);
    MisoClient.on('create', this._injectClient.bind(this));

    const ui = {};
    delegateGetters(ui, this, ['layouts']);
    defineValues(MisoClient, { ui });

    // layouts
    for (const LayoutClass of Object.values(layouts)) {
      if (LayoutClass.type) {
        this.layouts.register(LayoutClass);
      }
    }

    // custom elements
    const { containers, roles, ...others } = elements;
    // containers must go first, so their APIs will be ready before children are defined
    for (const elementClass of [
      ...Object.values(containers),
      ...Object.values(roles),
      ...Object.values(others),
    ]) {
      defineAndUpgrade(elementClass);
    }
  }

  async requireExtension(name) {
    switch (name) {
      case 'markdown':
        return await MisoClient.plugins.install('std:ui-markdown');
      default:
        throw new Error(`Unknown extension: ${name}`);
    }
  }

  _injectClient(client) {
    defineValues(client, {
      ui: new Ui(this, client),
    });
  }

  _getExtensions(client) {
    if (this._extensions.has(client)) {
      return this._extensions.get(client);
    }
    const extensions = new Extensions(this, client);
    this._extensions.set(client, extensions);
    return extensions;
  }

  _getRecommendationContext(client) {
    let context = this._recommendationContexts.get(client);
    if (!context) {
      this._recommendationContexts.set(client, context = new RecommendationContext(this, client));
    }
    return context;
  }

}

class Extensions {

  constructor(plugin, client) {
    this._plugin = plugin;
    this._client = client;
    this._contexts = {};
  }

  async require(name) {
    if (this._contexts[name]) {
      return this._contexts[name];
    }
    const plugin = await this._plugin.requireExtension(name);
    const context = this._contexts[name] = plugin.getContext(this._client);
    return context;
  }

}

class Ui {

  constructor(plugin, client) {
    this._plugin = plugin;
    this._client = client;

    defineValues(this, {
      sources: {
        api: sources.api(client),
      }
    });
  }

  get recommendation() {
    return this._recommendation || (this._recommendation = this._plugin._getRecommendationContext(this._client).interface);
  }

  get search() {
    return this._search || (this._search = new Search(this._plugin, this._client));
  }

  get ask() {
    return this._ask || (this._ask = new Ask(this._plugin, this._client));
  }

}
