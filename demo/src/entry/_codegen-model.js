import { kebabToLowerCamel } from '@miso.ai/commons';
import { codegen, spec, encodeConfig, decodeConfig } from '@miso.ai/client-sdk-codegen';

export function getModel(workflow) {
  /*
  const searchParams = new URLSearchParams(window.location.search);
  const { preset = 'minimal', ...config } = decodeConfig(searchParams.get('c')) || { preset: 'standard' };
  */
  return window.misoCodegenModel || (window.misoCodegenModel = new MisoCodegenModel({ workflow, spec }));
}

class MisoCodegenModel {

  constructor({
    workflow,
    spec,
    preset,
    config,
  } = {}) {
    this._workflow = workflow;
    this._spec = spec.workflows[workflow];
    this._preset = preset || this._spec.presets[0].slug;
    this._presetConfig = undefined;
    this._config = config || {};
    this._syncCode();
  }

  get workflow() {
    return this._workflow;
  }

  get spec() {
    return this._spec;
  }

  get preset() {
    return this._preset;
  }

  set preset(value) {
    this._preset = value;
    this._presetConfig = undefined;
    this._syncCode();
  }

  get config() {
    return Object.freeze({
      workflow: this._workflow,
      preset: this._preset,
      ...this._config,
    });
  }

  get presetConfig() {
    return this._presetConfig || (this._presetConfig = spec.resolvePreset({ workflow: this._workflow, preset: this._preset }));
  }

  get resolvedConfig() {
    return spec.resolvePreset(this.config);
  }

  clear() {
    this._config = {};
    this._syncCode();
  }

  setFeature(key, value) {
    switch (key) {
      case 'preset':
      case 'workflow':
        throw new Error(`Cannot set ${key} via setFeature`);
    }
    this._config = {
      ...this._config,
      [kebabToLowerCamel(key)]: value,
    };
    this._syncCode();
  }

  _syncCode() {
    this._code = codegen(this.config);
  }

}
