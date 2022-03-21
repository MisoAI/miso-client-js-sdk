import { BUILD } from './constants';
import EventEmitter from './util/events';
import Component from './util/component';
import { trimObj, executeWithCatch } from './util/objects';
import Api from './api';
import Context from './context';
import defaultMods from './mod';
import Debug from './plugin/debug';

class MisoClient extends Component {

  constructor(options) {
    super('client');
    this._config(options);

    this.context = new Context(this);
    this.api = new Api(this);

    MisoClient.instances.push(this);
    MisoClient._events.emit('instance', this);
    for (const plugin of MisoClient.plugins) {
      plugin.install(this);
    }
    // TODO: emit debug msg on client instance
  }

  get version() {
    return MisoClient.version;
  }

  _config(options) {
    this.config = Object.freeze(this._normalizeConfig(options));
  }

  _normalizeConfig(options) {
    if (typeof options === 'string') {
      return { apiKey: options };
    }
    // TODO: option: debug, noInteraction
    const { apiKey, apiHost, disableAutoAnonymousId } = options || {};
    if (!apiKey) {
      throw new Error('Require API key to initialize miso client.');
    }
    return trimObj({ apiKey, apiHost, disableAutoAnonymousId });
  }

  debug() {
    this.use(new Debug());
  }

  use(plugin) {
    plugin.install(this);
  }

  _debug() {
    if (this._debuggers) {
      for (const callback of this._debuggers) {
        executeWithCatch(callback, arguments);
      }
    }
  }

  _error(e) {
    MisoClient._error(e);
  }

}

// MisoClient static //
const events = new EventEmitter({
  error: (e) => MisoClient._error(e),
});

Object.assign(MisoClient, {
  plugins: [],
  _events: events,
  _error: (e) => console.error(e)
});

Object.defineProperties(MisoClient, {
  version: { value: BUILD.version },
  instances: { value: [] },
  use: {
    value: function(plugin) {
      for (const inst of MisoClient.instances) {
        inst.use(plugin);
      }
      MisoClient.plugins.push(plugin);
    },
  },
  debug: {
    value: function() {
      MisoClient.use(new Debug())
    },
  },
  mods: { value: Object.assign({}, defaultMods) }
});

export default MisoClient;
