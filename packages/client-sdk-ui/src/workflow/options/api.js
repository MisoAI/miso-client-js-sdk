import { trimObj, mergeApiPayloads } from '@miso.ai/commons';
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
  // useApi({ fl: [...] }) is the payload. Nesting it — useApi({ payload: {...} })
  // — used to be accepted in silence and the inner keys never reached the API.
  if (payload && typeof payload === 'object' && payload.payload && typeof payload.payload === 'object') {
    console.warn(
      `[miso] useApi(): a "payload" key was found inside the payload. Its contents ` +
      `(${Object.keys(payload.payload).join(', ')}) will be sent as a field named "payload" and ignored. ` +
      `Pass these options at the top level, e.g. useApi({ fl: [...] }).`
    );
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
