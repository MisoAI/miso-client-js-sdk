import { trimObj } from '@miso.ai/commons';
import { mergeOptions } from './utils.js';

export function normalizeApiOptions([name, payload] = []) {
  // TODO: take object form as well
  if (name === false) {
    return { actor: false };
  }
  if (typeof name === 'object' && payload === undefined) {
    payload = name;
    name = undefined;
  }
  let group = undefined;
  if (name && name.indexOf('/') !== -1) {
    [group, name] = name.split('/');
  }
  if ((name && typeof name !== 'string') || (payload !== undefined && typeof payload !== 'object')) {
    throw new Error(`Invalid arguments for useApi(): ${name}, ${payload}`);
  }
  return trimObj({ group, name, payload });
}

export function mergeApiOptions(...optionsList) {
  if (optionsList[optionsList.length - 1] === false) {
    return false;
  }
  return mergeOptions(optionsList, (merged, options) => Object.assign(merged, {
    ...options,
    payload: mergeApiPayloads(merged.payload, options.payload),
  }));
}

function mergeApiPayloads(base, overrides) {
  return {
    ...base,
    ...overrides,
    ...mergeObjectValueIfPresent('_meta', base, overrides),
  };
}

function mergeObjectValueIfPresent(key, base, overrides) {
  const baseValue = base && base[key];
  const overridesValue = overrides && overrides[key];
  const value = baseValue ? (overridesValue ? { ...baseValue, ...overridesValue } : baseValue) : overridesValue;
  return value !== undefined ? { [key]: value } : {};
}
