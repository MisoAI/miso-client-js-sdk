import { kebabToLowerCamel } from '@miso.ai/commons';
import { codegen, spec, encodeParameters, decodeParameters } from '@miso.ai/client-sdk-codegen';

class Model {
  constructor({
    config,
    onUpdate,
  } = {}) {
    this._config = config;
    this._onUpdate = onUpdate;
  }
  get config() {
    return this._config;
  }
  update(slug, value) {
    this._config = {
      ...this._config,
      [kebabToLowerCamel(slug)]: value,
    };
    this._onUpdate && this._onUpdate(this._config);
  }
}

function renderPresets(spec, config) {
  const element = document.querySelector('#root [data-role="presets"]');
  if (!element) {
    return;
  }
  element.innerHTML = `<div class="btn-group" role="group" aria-label="Preset options">${spec.presets.map(preset => renderPresetItem(preset, config.preset)).join('')}</div>`;
}

function renderPresetItem(preset, selected) {
  return `
<input type="radio" class="btn-check" name="preset" id="preset-${preset.slug}" autocomplete="off" value="${preset.slug}" ${selected === preset.slug ? 'checked' : ''}>
<label class="btn btn-outline-primary" for="preset-${preset.slug}">${preset.name}</label>`;
}

function renderFeatures(spec, config) {
  const element = document.querySelector('#root [data-role="features"]');
  if (!element) {
    return;
  }
  element.innerHTML = spec.features.map(feature => renderFeatureItem(feature)).join('');
}

function renderFeatureItem(feature) {
  return `<div>${feature.name}</div>`;
}

function updateCode(config) {
  const element = document.querySelector('#root [data-role="code"]');
  if (!element) {
    return;
  }
  const codeItems = codegen({ ...config, workflow }).items;
  if (!element.firstElementChild) {
    element.innerHTML = `<div class="accordion"></div>`;
  }
  element.firstElementChild.innerHTML = '';
  element.firstElementChild.append(...codeItems.map(renderCodeItem));
}

function renderCodeItem(code, index) {
  const element = document.createElement('div');
  element.className = 'accordion-item';
  element.dataset.type = code.type;
  element.innerHTML = `
    <h2 class="accordion-header" id="code-heading-${index}">
      <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#code-${index}" aria-expanded="true" aria-controls="code-${index}">
        ${code.name}
      </button>
    </h2>
    <div id="code-${index}" class="accordion-collapse collapse show" aria-labelledby="code-heading-${index}">
      <div class="accordion-body">
        <pre><code></code></pre>
      </div>
    </div>
  `;
  element.querySelector('code').innerText = code.content;
  return element;
}



// 2nd last segment
const workflow = window.location.pathname.replace(/\/$/, '').split('/').slice(-2, -1)[0];
const _spec = spec.workflows[workflow];

const searchParams = new URLSearchParams(window.location.search);
const config = decodeParameters(searchParams.get('c')) || { preset: _spec.presets[0].slug };

if (!config.preset) {
  config.preset = 'minimal';
}

const model = new Model({
  config,
  onUpdate: updateCode,
});

renderPresets(_spec, config);
renderFeatures(_spec, config);
updateCode(model.config);
