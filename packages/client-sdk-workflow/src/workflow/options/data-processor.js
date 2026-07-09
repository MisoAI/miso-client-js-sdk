import { asArray } from '@miso.ai/commons';

export function normalizeDataProcessorOptions(fns) {
  fns = asArray(fns);
  for (const fn of fns) {
    if (typeof fn !== 'function') {
      throw new Error(`Expect data processor options to be a function: ${fn}`);
    }
  }
  return fns;
}

export function mergeDataProcessorOptions(...optionsList) {
  return optionsList.flat().filter(Boolean);
}
