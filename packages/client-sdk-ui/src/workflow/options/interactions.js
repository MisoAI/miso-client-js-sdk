import { asArray } from '@miso.ai/commons';
import { mergeOptions } from './utils.js';

export function normalizeInteractionsOptions(options) {
  if (options === undefined) {
    return undefined;
  }
  if (options === false) {
    return {
      handle: () => {},
    };
  }
  // preprocess
  const preprocess = asArray(options.preprocess);
  for (const p of preprocess) {
    if (typeof p !== 'function') {
      throw new Error(`Expect preprocess options to be a function: ${p}`);
    }
  }
  // handle
  if (options.handle && typeof options.handle !== 'function') {
    throw new Error(`Expect handle options to be a function: ${options.handle}`);
  }
  return { ...options, preprocess };
}

export function mergeInteractionsOptions(...optionsList) {
  if (optionsList[optionsList.length - 1] === false) {
    return false;
  }
  return mergeOptions(optionsList, (merged, options) => Object.assign(merged, {
    ...options,
    preprocess: concatArrays(merged.preprocess, options.preprocess),
  }));
}

