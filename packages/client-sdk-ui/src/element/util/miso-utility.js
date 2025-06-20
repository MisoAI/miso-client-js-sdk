export default class MisoUtilityElement extends HTMLElement {

  constructor({ actions = [] } = {}) {
    super();
    this._actions = actions;
    this._unsubscribes = [];
  }

  // lifecycle //
  async connectedCallback() {
    const handleAction = event => this._handleAction(event);
    this.addEventListener('miso:action', handleAction);
    this._unsubscribes.push(() => this.removeEventListener('miso:action', handleAction));
  }

  disconnectedCallback() {
    for (const unsubscribe of this._unsubscribes) {
      unsubscribe();
    }
    this._unsubscribes = [];
  }

  _handleAction(event) {
    const { target, name } = event.detail || {};
    if (!name || !target || target !== this.getAttribute('name')) {
      return;
    }
    if (!this._actions.includes(name)) {
      return;
    }
    if (this._doAction({ name })) {
      event.stopPropagation();
    }
  }

  _doAction(args) {
    const { name } = args;
    this[name](args);
    return true;
  }

}
