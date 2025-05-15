class MisoCodegenPresetsElement extends HTMLElement {

  constructor() {
    super();
    this._model = undefined;
  }

  connectedCallback() {
    const model = window.misoCodegenModel;
    if (!model) {
      throw new Error('window.misoCodegenModel not found');
    }
    this._model = model;
    this._render();
  }

  disconnectedCallback() {}

  _render() {
    const { spec, config } = this._model;
    this.innerHTML = `<div class="btn-group" role="group" aria-label="Preset options">${spec.presets.map(preset => this._renderItem(preset, config.preset)).join('')}</div>`;
  }

  _renderItem(preset, selected) {
    return `
<input type="radio" class="btn-check" name="preset" id="preset-${preset.slug}" autocomplete="off" value="${preset.slug}" ${selected === preset.slug ? 'checked' : ''}>
<label class="btn btn-outline-primary" for="preset-${preset.slug}">${preset.name}</label>
`.trim();
  }

}

export function defineElements() {
  customElements.define('miso-codegen-presets', MisoCodegenPresetsElement);
}
