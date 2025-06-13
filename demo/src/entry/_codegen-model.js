import { kebabToLowerCamel, trimObj } from '@miso.ai/commons';
import { codegen, spec as _spec, encodeConfig, decodeConfig } from '@miso.ai/client-sdk-codegen';
import { deepEquals, deepClone } from './_codegen-utils.js';

export function getModel(workflow) {
  /*
  const searchParams = new URLSearchParams(window.location.search);
  const { preset = 'minimal', ...config } = decodeConfig(searchParams.get('c')) || { preset: 'standard' };
  */
  return window.misoCodegenModel || (window.misoCodegenModel = new MisoCodegenConfigViewModel({ workflow, preset: 'standard' }));
}

function trimAndFreeze(obj) {
  return Object.freeze(trimObj(obj));
}

function toCode(config) {
  const { items } = codegen(config);
  return Object.freeze({ items });
}

function toPresets(spec, config) {
  return spec.presets.map(preset => {
    return {
      ...preset,
      selected: config.preset === preset.slug,
    };
  });
}

function toFeatures(spec, config) {
  config = _spec.resolvePreset(config);
  return spec.features.map(feature => {
    return {
      ...feature,
      options: feature.options.map(option => {
        return {
          ...option,
          selected: deepEquals(config[kebabToLowerCamel(feature.slug)], option.value),
        };
      }),
    };
  });
}

export class MisoCodegenConfigViewModel {

  constructor(config = {}) {
    const { workflow } = config;
    const spec = this._spec = _spec.workflows[workflow];
    this._state = trimAndFreeze({
      workflow,
      spec,
      config,
      presets: toPresets(spec, config),
      features: toFeatures(spec, config),
      code: toCode(config),
    });
    this._callbacks = [];
  }

  subscribe(callback) {
    this._callbacks.push(callback);
    return () => {
      this._callbacks = this._callbacks.filter(cb => cb !== callback);
    };
  }

  get spec() {
    return this._spec;
  }

  get state() {
    return this._state;
  }

  set preset(preset) {
    if (!preset) {
      throw new Error('Preset is required');
    }
    if (this._state.config.preset === preset) {
      return;
    }
    this._apply('preset', { preset });
  }

  set(key, value) {
    switch (key) {
      case 'preset':
      case 'workflow':
        throw new Error(`Cannot set ${key} via set() method. Use corresponding setter instead.`);
    }
    const feature = findFeature(this._state, key);
    if (!feature) {
      return;
    }
    const option = findOption(feature, value);
    if (!option || option.selected) {
      return;
    }
    this._apply('feature', { key, value });
  }

  // action & transition //
  _apply(type, data) {
    const action = trimAndFreeze({ type, ...data });
    const oldState = this._state;
    const newState = this._state = this._transitState(action);
    for (const callback of this._callbacks) {
      try {
        callback(action, newState, oldState);
      } catch (e) {
        console.error(e);
      }
    }
  }

  _transitState(action) {
    const { workflow } = this._state.config;
    switch (action.type) {
      case 'preset':
        // clear all other features
        return this._transitStateByConfig({
          workflow,
          preset: action.preset,
        });
      case 'feature':
        return this._transitStateByConfig({
          ..._spec.resolvePreset(this._state.config),
          [kebabToLowerCamel(action.key)]: action.value,
        });
    }
  }

  _transitStateByConfig(config) {
    config = trimAndFreeze(config);
    return trimAndFreeze({
      ...this._state,
      presets: toPresets(this._spec, config),
      features: toFeatures(this._spec, config),
      config,
      code: toCode(config),
    });
  }

}

export function toVueUpdateHandler(state) {
  return (action, newState) => {
    switch (action.type) {
      case 'preset':
        state.config = deepClone(newState.config);
        syncPresetSelection(state, action.preset);
        syncAllFeatureSelections(state, newState.config);
        break;
      case 'feature':
        const feature = findFeature(state, action.key);
        if (!feature) {
          throw new Error(`Feature ${action.key} not found`);
        }
        state.config[kebabToLowerCamel(action.key)] = action.value;
        syncPresetSelection(state, undefined);
        syncFeatureSelection(feature, action.value);
        break;
    }
    state.code = deepClone(newState.code);
  };
}

function syncPresetSelection(state, value) {
  state.config.preset = value;
  for (const preset of state.presets) {
    const selected = preset.slug === value;
    if (preset.selected !== selected) {
      preset.selected = selected;
    }
  }
}

function syncAllFeatureSelections(state, config) {
  config = _spec.resolvePreset(config);
  for (const feature of state.features) {
    syncFeatureSelection(feature, config[kebabToLowerCamel(feature.slug)]);
  }
}

function syncFeatureSelection(feature, value) {
  for (const option of feature.options) {
    const selected = deepEquals(option.value, value);
    if (option.selected !== selected) {
      option.selected = selected;
    }
  }
}

function findFeature(state, featureSlug) {
  for (const feature of state.features) {
    if (feature.slug === featureSlug) {
      return feature;
    }
  }
  return undefined;
}

function findOption(feature, optionValue) {
  for (const option of feature.options) {
    if (deepEquals(option.value, optionValue)) {
      return option;
    }
  }
  return undefined;
}
