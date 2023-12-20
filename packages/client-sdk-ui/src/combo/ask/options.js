import { trimObj } from '@miso.ai/commons';
import { templates } from '../../defaults/ask/index.js';

// TODO: generalize

const { currentScript } = document;

const DEFAULT_OPTIONS = Object.freeze({
  templates,
  autostart: true,
});

const GROUPS = ['templates', 'phrases', 'features'];

export class AskComboOptions {

  constructor() {
    this._defaults = DEFAULT_OPTIONS;
    this._scriptSrc = readFromScriptSrc();
    this._pageUrl = readFromPageUrl();
  }

  resolve(options) {
    return normalizeOptions(mergeOptions(this._defaults, this._scriptSrc, options, this._pageUrl));
  }

}

export function mergeOptions(...optionsList) {
  let merged = {};
  for (const options of optionsList) {
    if (options) {
      merged = mergeTwoOptions(merged, options);
    }
  }
  return merged;
}

function mergeTwoOptions(merged, overrides) {
  if (!overrides) {
    return merged;
  }
  Object.assign(merged, overrides);
  for (const key of GROUPS) {
    if (key in overrides) {
      merged[key] = { ...merged[key], ...overrides[key] };
    }
  }
  return merged;
}

function normalizeOptions({ api_key: apiKey, api_host: apiHost, templates, phrases, ...options } = {}) {
  return trimObj({
    apiKey,
    apiHost,
    templates: templateAsFunction(templates),
    phrases,
    ...options,
  });
}

/**
 * Get parameters from script src attribute.
 * - 'q' is ignored.
 */
function readFromScriptSrc() {
  if (!currentScript || !currentScript.src) {
    return {};
  }
  const anchor = document.createElement('a');
  anchor.href = currentScript.src;

  const params = {};
  for (const [key, value] of new URLSearchParams(anchor.search)) {
    if (key === 'q') {
      continue;
    }
    params[key] = coerceValue(value);
  }
  return params;
}

/**
 * Get parameters from page URL with `miso_` prefix.
 * - 'q' is not prefixed.
 * - 'miso_api_key' is ignored.
 */
function readFromPageUrl() {
  const params = {};
  for (const [key, value] of new URLSearchParams(window.location.search)) {
    if (key.startsWith('miso_') && key.length > 5 && key !== 'miso_api_key') {
      params[key.substring(5)] = coerceValue(value);
    } else if (key === 'q') {
      params.q = value;
    }
  }
  return params;
}

function coerceValue(value) {
  return value === '' ? true : value === 'false' ? false : value;
}

function templateAsFunction(value) {
  if (value === undefined || value === null) {
    return value;
  }
  switch (typeof value) {
    case 'function':
      return value;
    case 'string':
    case 'number':
      return () => value;
    case 'object':
      return Array.isArray(value) ? value.map(templateAsFunction) : mappingObjectValues(value, templateAsFunction);
    default:
      throw new Error(`Unsupported template type: ${value}`);
  }
}

function mappingObjectValues(obj, fn) {
  const mapped = {};
  for (const [key, value] of Object.entries(obj)) {
    mapped[key] = fn(value);
  }
  return mapped;
}
