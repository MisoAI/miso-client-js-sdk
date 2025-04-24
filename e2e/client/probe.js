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
        window._pw({ _event: 'workflow', ...this._getWorkflowInfo(workflow) });
      });
    });
    onHubUpdate(({ workflow, action: _action, name: _event, state, ...event }) => {
      window._pw({ _workflow: this._getWorkflowInfo(workflow), _action, _event, ...state, ...event });
    });
  }

  _getWorkflowInfo(workflow) {
    return { name: workflow._name, uuid: workflow.meta.uuid };
  }

}

const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  window.MisoClient.plugins.use(PlaywrightPlugin);
});
