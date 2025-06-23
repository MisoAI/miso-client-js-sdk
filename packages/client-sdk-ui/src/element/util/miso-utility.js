export default class MisoUtilityElement extends HTMLElement {

  constructor({ actions = [], clickables = [] } = {}) {
    super();
    this._actions = actions;
    this._clickables = clickables;
    this._unsubscribes = [];
  }

  // lifecycle //
  async connectedCallback() {
    const handleAction = event => this._handleAction(event);
    const handleClick = event => this._handleClick(event);

    this.addEventListener('miso:action', handleAction);
    this.addEventListener('click', handleClick);

    this._unsubscribes = [
      ...this._unsubscribes,
      () => this.removeEventListener('miso:action', handleAction),
      () => this.removeEventListener('click', handleClick),
    ];
  }

  disconnectedCallback() {
    for (const unsubscribe of this._unsubscribes) {
      unsubscribe();
    }
    this._unsubscribes = [];
  }

  _handleAction(event) {
    const { target, name } = event.detail || {};
    if (!name || !target || !this.matches(target)) {
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

  _handleClick(event) {
    const { target, button } = event;
    if (button !== 0) {
      return; // only left click
    }
    for (let { role, selector, action } of this._clickables) {
      selector = selector || `[data-role="${role}"]`;
      if (!selector) {
        continue;
      }
      if (target.closest(selector)) {
        this._doAction({ name: action });
        event.stopPropagation();
        return;
      }
    }
  }

}
