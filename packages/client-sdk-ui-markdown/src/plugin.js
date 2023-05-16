import { Component } from '@miso.ai/commons';
import { Renderer } from '@miso.ai/progressive-markdown';

const PLUGIN_ID = 'std:ui-markdown';

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
    this.interface = new Markdown(this);
  }

  config() {
    // TODO
  }

  createRenderer(options) {
    // TODO: other options
    return new Renderer(options);
  }

}


class Markdown {

  constructor(context) {
    this._context = context;
  }

  config(...args) {
    return this._context.config(...args);
  }

}
