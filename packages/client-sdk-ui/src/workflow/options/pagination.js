import { mergeOptions } from './utils.js';

export function normalizePaginationOptions(options) {
  if (options === undefined) {
    throw new Error(`Expect pagination options to be an object or a boolean value: ${options}`);
  }
  if (typeof options === 'boolean') {
    options = { active: options };
  }
  return options;
}

export function mergePaginationOptions(...optionsList) {
  if (optionsList[optionsList.length - 1] === false) {
    return false;
  }
  return mergeOptions(optionsList, (merged, options) => Object.assign(merged, options));
}
