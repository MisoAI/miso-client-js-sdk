// setup promise of pw hook
const _pw$ = window._pw$ = new Promise(resolve => {
  let _pw;
  Object.defineProperty(window, '_pw', {
    set: value => {
      _pw = value;
      setTimeout(() => resolve(value)); // resolve at next tick
    },
    get: () => _pw,
  });
});

function kebabToCamel(str) {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function serializeWorkflow(workflow) {
  return { name: workflow._name, uuid: workflow.meta.uuid };
}

function serialize(name, ...args) {
  switch (name) {
    case 'MisoClient':
    case 'client':
      // TODO: later
      return [name];
    case 'workflow':
      return [name, serializeWorkflow(args[0])];
    default:
      return [name, ...args.map(arg => arg._workflow ? { ...arg, _workflow: serializeWorkflow(arg._workflow) } : arg)];
  }
}

function asPredicate0(match) {
  switch (typeof match) {
    case 'function':
      return match;
    default:
      return (...args) => args.some(arg => arg === match || arg && (arg.status === match || arg._workflow === match));
  }
}

function asPredicate(...matches) {
  matches = matches.map(match => asPredicate0(match));
  return (...args) => matches.every(match => match(...args));
}

class Playwright {

  constructor() {
    this._eventResolutionIndex = 0;
    this._eventResolutions = [];
    this._valueResolutions = {};
    for (const name of ['MisoClient', 'client', 'explore', 'ask', 'hybridSearch', 'search', 'recommendation']) {
      Object.defineProperty(this, name, {
        get: () => this._valueResolution(name).promise,
      });
    }
  }

  async waitForEvent(...matches) {
    const predicate = asPredicate(...matches);
    return new Promise(resolve => {
      this._eventResolutions.push({ index: this._eventResolutionIndex++, predicate, resolve });
    });
  }

  async emit(...args) {
    this._resolveValue(...args);
    this._resolveEvent(...args);
    this._sendToNode(...args);
    return this;
  }

  _resolveEvent(...args) {
    // make a copy to avoid mutation
    for (const { index, predicate, resolve } of [...this._eventResolutions]) {
      try {
        if (predicate(...args)) {
          this._eventResolutions = this._eventResolutions.filter(res => res.index !== index);
          resolve(args);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  _resolveValue(name, value) {
    switch (name) {
      case 'MisoClient':
      case 'client':
        this._valueResolution(name).resolve(value);
        break;
      case 'workflow':
        this._valueResolution(kebabToCamel(value._name)).resolve(value);
        break;
    }
  }

  _valueResolution(name) {
    let res = this._valueResolutions[name];
    if (!res) {
      res = {};
      res.promise = new Promise(resolve => {
        res.resolve = resolve;
      });
      this._valueResolutions[name] = res;
    }
    return res;
  }

  async _sendToNode(...args) {
    // TODO: we could queue before it's ready
    if (!window._pw) {
      await _pw$;
    }
    window._pw(...serialize(...args));
  }

}

const pw = window.pw = new Playwright();

class PlaywrightPlugin {

  static get id() {
    return 'playwright';
  }

  install(MisoClient, { onHubUpdate }) {
    MisoClient.on('create', client => {
      pw.emit('client', client);
      client.on('workflow', workflow => pw.emit('workflow', workflow));
    });
    onHubUpdate(({ workflow: _workflow, action: _action, name, state, ...event }) => {
      pw.emit(name, { _workflow, _action, ...state, ...event });
    });
  }

}

const misodev = window.misodev || (window.misodev = []);
misodev.push(async ({ addCmdTransform }) => {
  addCmdTransform(fn => async () => {
    if (!window._pw) {
      await _pw$;
    }
    fn();
  });
  const { MisoClient } = window;
  MisoClient.plugins.use(PlaywrightPlugin);
  pw.emit('MisoClient', MisoClient);
});
