import './_codegen-snippet-element.js';

export default class MisoCodegenCodesElement extends HTMLElement {

  static get tagName() {
    return 'miso-codegen-codes';
  }

  constructor() {
    super();
    this._unsubscribes = [];
    this._model = undefined;
    this._snippetElement = null;
  }

  connectedCallback() {
    const model = window.misoCodegenModel;
    if (!model) {
      throw new Error('window.misoCodegenModel not found');
    }
    this._model = model;
    this._unsubscribes.push(model.on('code', () => this._update()));
    this._render();
    this._update();
  }

  disconnectedCallback() {
    for (const unsubscribe of this._unsubscribes) {
      unsubscribe();
    }
  }

  _render() {
    this.innerHTML = `
      <div class="code-container">
        <miso-codegen-snippet language="javascript"></miso-codegen-snippet>
      </div>
    `;
    this._snippetElement = this.querySelector('miso-codegen-snippet');
  }

  _update() {
    if (this._snippetElement) {
      this._snippetElement.content = this._model?.code || '';
    }
  }
}
