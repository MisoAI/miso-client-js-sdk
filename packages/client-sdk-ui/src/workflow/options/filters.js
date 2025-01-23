import { mergeOptions, normalizeOptions } from './utils.js';

export const normalizeFiltersOptions = normalizeOptions;

export function mergeFiltersOptions(...optionsList) {
  if (optionsList[optionsList.length - 1] === false) {
    return false;
  }
  return mergeOptions(optionsList, (merged, options) => Object.assign(merged, options));
}
