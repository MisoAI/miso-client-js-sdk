import { mergeRendererOptions } from '../utils.js';

export * from './helpers.js';
export * from './miso.js';

// backward compatibility
function normalizeOptions(options) {
  const { processValue, processMarkdown, ...rest } = options;
  return { processMarkdown: processMarkdown || processValue, ...rest };
}

export function resolvePresets({ presets = [], ...options } = {}) {
  return presets.reduce(resolvePreset, normalizeOptions(options));
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
