import { addOrRemoveClass } from './_codegen-utils.js';

export default class MisoCodegenPresetsElement extends HTMLElement {

  static get tagName() {
    return 'miso-codegen-presets';
  }

  constructor() {
    super();
    this._model = undefined;
    this._handleButtonClick = this._handleClick.bind(this);
    this._renderItem = this._renderItem.bind(this);
  }

  connectedCallback() {
    const model = window.misoCodegenModel;
    if (!model) {
      throw new Error('window.misoCodegenModel not found');
    }
    this._model = model;
    model.on('preset', () => this._syncSelection());
    this._render();
    this._syncSelection();
    this.addEventListener('click', this._handleClick);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this._handleClick);
  }

  _render() {
    this.innerHTML = `<div class="btn-group" role="group" aria-label="Preset options">${this._model.spec.presets.map(this._renderItem).join('')}</div>`;
  }

  _renderItem(preset) {
    return `<button class="btn btn-outline-primary" data-preset="${preset.slug}" data-role="option">${preset.name}</button>`;
  }

  _syncSelection() {
    const selected = this._model.preset;
    for (const optionElement of this.querySelectorAll('[data-role="option"]')) {
      addOrRemoveClass(optionElement, 'active', optionElement.dataset.preset === selected);
    }
  }

  _handleClick(event) {
    const optionElement = event.target.closest('[data-role="option"]');
    if (!optionElement) {
      return;
    }
    this._model.preset = optionElement.dataset.preset;
  }

}
