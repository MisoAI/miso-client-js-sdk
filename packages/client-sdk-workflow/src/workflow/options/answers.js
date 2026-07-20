import { mergeOptions } from './utils.js';
import { mergeApiOptions } from './api.js';

export function normalizeAnswersOptions(options) {
  if (!options || typeof options !== 'object') {
    throw new Error(`Expect answers options to be an object: ${options}`);
  }
  return options;
}

export function mergeAnswersOptions(...optionsList) {
  return mergeOptions(optionsList, (merged, options) => Object.assign(merged, {
    ...options,
    api: mergeApiOptions(merged.api, options.api),
  }));
}
