import { Component } from '@miso.ai/commons';
import { Renderer, mergeRendererOptions, resolvePresets, presetMiso, transform, transformSync } from '@miso.ai/progressive-markdown';

const PLUGIN_ID = 'std:ui-markdown';

const DEFAULT_RENDERER_OPTIONS = Object.freeze({
  presets: [presetMiso],
});

export default class UiMarkdownPlugin extends Component {

  static get id() {
    return PLUGIN_ID;
  }

  constructor() {
    super(PLUGIN_ID);
    this._clientContexts = new WeakMap();
  }

  install(MisoClient, context) {
    context.addSubtree(this);
    (async () => {
      // TODO: make a more graceful way to add interface
      await context.whenInstalled('std:ui');
      MisoClient.on('create', client => this._installClient(client));
    })();
  }

  _installClient(client) {
    Object.defineProperty(client.ui, 'markdown', {
      get: () => this.getContext(client).interface,
    });
  }

  getContext(client) {
    let context = this._clientContexts.get(client);
    if (!context) {
      this._clientContexts.set(client, context = new MarkdownContext(this, client));
    }
    return context;
  }

}

class MarkdownContext extends Component {

  constructor(plugin, client) {
    super('ui:markdown', plugin);
    this._plugin = plugin;
    this._client = client;
    this._options = {};
    this.interface = new Markdown(this);
  }

  config(options = {}) {
    this._options = options;
  }

  createRenderer(options = {}) {
    return new Renderer(resolvePresets(this._mergeRendererOptions(options)));
  }

  /**
   * Pure markdown -> HTML transformation: same option cascade as
   * createRenderer(), without the progressive rendering machinery.
   */
  async transform(markdown, sources, options) {
    return transform(markdown, sources, this._mergeRendererOptions(options));
  }

  transformSync(markdown, sources, options) {
    return transformSync(markdown, sources, this._mergeRendererOptions(options));
  }

  _mergeRendererOptions(options = {}) {
    const contextOptions = this._options && this._options.renderer || {};
    return mergeRendererOptions(DEFAULT_RENDERER_OPTIONS, contextOptions, options);
  }

}

class Markdown {

  constructor(context) {
    this._context = context;
  }

  config(...args) {
    return this._context.config(...args);
  }

  transform(...args) {
    return this._context.transform(...args);
  }

  transformSync(...args) {
    return this._context.transformSync(...args);
  }

  get defaultRendererOptions() {
    return DEFAULT_RENDERER_OPTIONS;
  }

}
