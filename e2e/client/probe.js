// setup promise of pw hook
window._pw$ = new Promise(resolve => {
  let _pw;
  Object.defineProperty(window, '_pw', {
    set: value => {
      _pw = value;
      setTimeout(() => resolve(value)); // resolve at next tick
    },
    get: () => _pw,
  });
});

class PlaywrightPlugin {

  static get id() {
    return 'playwright';
  }

  install(MisoClient, { onHubUpdate }) {
    MisoClient.on('create', client => {
      client.on('workflow', workflow => {
        window._pw('event', { _event: 'workflow', ...this._getWorkflowInfo(workflow) });
      });
    });
    onHubUpdate(({ workflow, action: _action, name: _event, state, ...event }) => {
      window._pw('event', { _workflow: this._getWorkflowInfo(workflow), _action, _event, ...state, ...event });
    });
  }

  _getWorkflowInfo(workflow) {
    return { name: workflow._name, uuid: workflow.meta.uuid };
  }

}

const misodev = window.misodev || (window.misodev = []);
misodev.push(async ({ addCmdTransform }) => {
  addCmdTransform(fn => async () => {
    if (window._pw$) {
      await window._pw$;
    }
    fn();
  });
  window.MisoClient.plugins.use(PlaywrightPlugin);
});

class Playwright {

  done() {
    return this.signal('done');
  }

  signal(name, data) {
    window._pw('signal', name, data);
    return this;
  }

}

window.pw = new Playwright();
