import { mergeOptions } from './utils.js';

export function normalizeTemplatesOptions(options = {}) {
  const normalize = {};
  for (const [key, args] of Object.entries(options)) {
    normalize[key] = normalizeTemplateOptions(args);
  }
  return normalize;
}

function normalizeTemplateOptions(args) {
  // TODO: if object, make it function arguments
  return args === undefined ? undefined : typeof args !== 'function' ? () => args : args;
}

export function mergeTemplatesOptions(...optionsList) {
  return mergeOptions(optionsList, (merged, options) => {
    for (const [key, args] of Object.entries(options)) {
      merged[key] = mergeTemplateOptions(merged[key], args);
    }
    return merged;
  });
}

function mergeTemplateOptions(base, overrides) {
  return normalizeTemplateOptions(overrides) || base;
}
