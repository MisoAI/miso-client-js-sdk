import { mergeRendererOptions } from '../utils.js';

export * from './helpers.js';
export { default as presetMiso } from './miso.js';

export function resolvePresets({ presets = [], ...options } = {}) {
  return presets.reduce(resolvePreset, options);
}

function resolvePreset(options, preset) {
  switch (typeof preset) {
    case 'object':
      return mergeRendererOptions(preset, options);
    case 'function':
      return preset(options);
    default:
      throw new Error(`Expect preset to be an object or a function: ${preset}`);
  }
}
