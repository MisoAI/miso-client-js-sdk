import { Component, Resolution, defineAndUpgrade, delegateGetters, defineValues } from '@miso.ai/commons';
import { Asks, HybridSearch, Explores, Search, Recommendations } from './workflow/index.js';
import { AskCombo } from './combo/index.js';
import Layouts from './layouts.js';
import * as elements from './element/index.js';
import * as layouts from './layout/index.js';
import * as sources from './source.js';
import * as defaults from './defaults/index.js';
import * as traits from './trait/index.js';
import { loadStylesIfNecessary } from './styles.js';

import MisoContainerElement from './element/container/miso-container.js';
import MisoContextElement from './element/context/miso-context.js';
import MisoComboElement from './element/combo/miso-combo.js';

const PLUGIN_ID = 'std:ui';

export default class UiPlugin extends Component {

  static get id() {
    return PLUGIN_ID;
  }

  constructor() {
    super('ui');
    this.layouts = new Layouts(this);
    this._recommendations = new WeakMap();
    this._explores = new WeakMap();
    this._asks = new WeakMap();
    this._extensions = new WeakMap();
    this._ready = new Resolution();
  }

  async install(MisoClient, context) {
    context.addSubtree(this);
    MisoClient.on('create', this._injectClient.bind(this));

    const ui = { defaults, traits };
    delegateGetters(ui, this, ['layouts', 'combo', 'ready']);
    defineValues(this, { MisoClient });
    defineValues(MisoClient, { ui });

    // combo
    this.combo = new Combo(this, MisoClient);

    // layouts
    const LayoutClasses = Object.values(layouts).filter(LayoutClass => LayoutClass.type);
    for (const LayoutClass of LayoutClasses) {
      LayoutClass.MisoClient = MisoClient; // TODO: find better way
    }
    for (const LayoutClass of LayoutClasses) {
      this.layouts.register(LayoutClass);
    }

    // custom elements
    const { containers, roles, combos, contexts, ...others } = elements;
    // containers must go first, so their APIs will be ready before children are defined
    const ElementClasses = [
      ...Object.values(combos),
      ...Object.values(contexts),
      ...Object.values(containers),
      ...Object.values(roles),
      ...Object.values(others),
    ];
    const ElementSuperClasses = [MisoContainerElement, MisoContextElement, MisoComboElement];
    for (const ElementClass of [...ElementSuperClasses, ...ElementClasses]) {
      ElementClass.MisoClient = MisoClient; // TODO: find better way
    }

    // load styles
    await loadStylesIfNecessary();

    // define custom elements
    for (const ElementClass of ElementClasses) {
      defineAndUpgrade(ElementClass);
    }

    this._ready.resolve();
  }

  async requireExtension(name) {
    switch (name) {
      case 'markdown':
        return await this.MisoClient.plugins.install('std:ui-markdown');
      default:
        throw new Error(`Unknown extension: ${name}`);
    }
  }

  get ready() {
    return Promise.all([
      this._ready.promise,
      MisoClient.any(), // TODO: we need to wait for element connection
    ]).then(() => {});
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

  _getRecommendations(client) {
    let recommendations = this._recommendations.get(client);
    if (!recommendations) {
      this._recommendations.set(client, recommendations = new Recommendations(this, client));
    }
    return recommendations;
  }

  _getExplores(client) {
    let explores = this._explores.get(client);
    if (!explores) {
      this._explores.set(client, explores = new Explores(this, client));
    }
    return explores;
  }

  _getAsks(client) {
    let asks = this._asks.get(client);
    if (!asks) {
      this._asks.set(client, asks = new Asks(this, client));
    }
    return asks;
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
      },
    });
  }

  get recommendations() {
    return this._recommendations || (this._recommendations = this._plugin._getRecommendations(this._client));
  }

  get recommendation() {
    return this.recommendations.get(); // get default recommendation unit
  }

  get search() {
    return this._search || (this._search = new Search(this._plugin, this._client));
  }

  get asks() {
    return this._asks || (this._asks = this._plugin._getAsks(this._client));
  }

  get ask() {
    return this.asks.root;
  }

  get hybridSearch() {
    return this._hybridSearch || (this._hybridSearch = new HybridSearch(this._plugin, this._client));
  }

  get explores() {
    return this._explores || (this._explores = this._plugin._getExplores(this._client));
  }

  get explore() {
    return this.explores.get(); // get default explore unit
  }

  get ready() {
    return this._plugin._ready.promise;
  }

}

class Combo {

  constructor(plugin, MisoClient) {
    this._plugin = plugin;
    this._MisoClient = MisoClient;
  }

  get ask() {
    return this._ask || (this._ask = new AskCombo(this._plugin, this._MisoClient));
  }

}
