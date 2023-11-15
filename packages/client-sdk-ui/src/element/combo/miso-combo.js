export default class MisoComboElement extends HTMLElement {

  constructor() {
    super();
  }

  // TODO: events

  // lifecycle //
  async connectedCallback() {
    if (document.body.contains(this)) { // in case already disconnected
      this._setCombo(this._getCombo(MisoComboElement.MisoClient));
    }
  }

  disconnectedCallback() {
  }

  _getCombo(MisoClient) {
    throw new Error('Unimplemented');
  }

  _setCombo(combo) {
    if (this._combo === combo) {
      return;
    }
    this._combo = combo;
    combo.element = this;
    combo.autoStart();
  }

}
