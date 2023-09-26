import { Component, API } from '@miso.ai/commons';

const PLUGIN_ID = 'std:auto-events';

export default class AutoEventsPlugin extends Component {

  static get id() {
    return PLUGIN_ID;
  }

  constructor() {
    super('auto-events');
    this._contexts = new WeakMap();
  }

  install(MisoClient, context) {
    context.addSubtree(this);
    MisoClient.on('create', this._injectClient.bind(this));
    context.addPayloadPass(this._captureApiRequest.bind(this));
  }

  _injectClient(client) {
    const context = new AutoEventsContext(this);
    this._contexts.set(client, context);
    client.autoEvents = context.interface;
  }

  _captureApiRequest({ client, apiGroup, apiName, payload }) {
    switch (apiGroup) {
      case API.GROUP.SEARCH:
        switch (apiName) {
          case API.NAME.SEARCH:
            this._captureSearchApiRequest(client, payload);
            break;
        }
        break;
    }
  }

  _captureSearchApiRequest(client, { q: keywords }) {
    if (!keywords || keywords === '*') {
      // might be a facet search without real keywords
      return;
    }
    const context = this._contexts.get(client);
    if (!context || !context._config.search) {
      return;
    }
    client.api.interactions.upload({
      type: 'search',
      search: { keywords },
      context: { custom_context: { channel: 'miso_api' } },
    });
  }

}

class AutoEventsContext {

  constructor(plugin) {
    this._plugin = plugin;
    this._config = {
      search: true,
    };
    this.interface = Object.freeze({
      config: this.config.bind(this),
    });
  }

  config(options = {}) {
    if (typeof options !== 'object') {
      throw new Error(`Config options must be an object or undefined: ${options}`);
    }
    for (const key of options) {
      if (!this._config.hasOwnProperty(key)) {
        continue;
      }
      const oldValue = this._config[key];
      const newValue = options[key];
      if (newValue !== oldValue) {
        this._config[key] = oldValue;
        this._plugin._events.emit('config', `${key}: ${oldValue} -> ${newValue}`);
      }
    }
    return Object.freeze({
      ...this._config,
    });
  }

}
