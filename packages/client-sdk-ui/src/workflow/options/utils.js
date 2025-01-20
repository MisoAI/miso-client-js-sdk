import { trimObj } from '@miso.ai/commons';

export function concatArrays(a0, a1) {
  return (a0 && a0.length) ? (a1 && a1.length) ? [...a0, ...a1] : a0 : a1;
}

export function mergeOptions(optionsList, merge) {
  let merged = {};
  for (const options of optionsList) {
    if (!options) {
      continue;
    }
    merged = merge(merged, options);
  }
  return trimObj(merged);
}
