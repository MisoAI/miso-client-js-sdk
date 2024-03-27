import { Component } from '@miso.ai/commons';
import { Renderer, mergeRendererOptions } from '@miso.ai/progressive-markdown';
import remarkGfm from 'remark-gfm';
import rehypeMinifyWhitespace from 'rehype-minify-whitespace';
import rehypeLinkClass from './rehype-link-class.js';

const PLUGIN_ID = 'std:ui-markdown';

const DEFAULT_PARSER_OPTIONS = Object.freeze({
  remark: [remarkGfm],
  rehype: [rehypeMinifyWhitespace, rehypeLinkClass],
});
const DEFAULT_RENDERER_OPTIONS = Object.freeze({
  parser: DEFAULT_PARSER_OPTIONS,
});

function createBaseRendererOptions({ onCitationLink } = {}) {
  return {
    parser: {
      remark: [remarkGfm],
      rehype: [rehypeMinifyWhitespace, () => rehypeLinkClass(onCitationLink)],
    },
  };
}

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
    const contextOptions = this._options && this._options.renderer || {};
    const baseRendererOptions = createBaseRendererOptions({ ...contextOptions, ...options });
    return new Renderer(mergeRendererOptions(baseRendererOptions, contextOptions, options));
  }

}

class Markdown {

  constructor(context) {
    this._context = context;
  }

  config(...args) {
    return this._context.config(...args);
  }

  get defaultRendererOptions() {
    return DEFAULT_RENDERER_OPTIONS;
  }

}
