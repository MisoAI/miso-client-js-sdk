import * as templates from './templates.js';

// TODO: generalize

const { currentScript } = document;

const DEFAULT_OPTIONS = Object.freeze({
  templates,
});

export default class AskComboOptions {

  constructor() {
    this._defaults = DEFAULT_OPTIONS;
    this._scriptSrc = readFromScriptSrc();
    this._pageUrl = readFromPageUrl();
  }

  resolve(options) {
    return mergeOptions(this._defaults, this._scriptSrc, options, this._pageUrl);
  }

}

function mergeOptions(...optionsList) {
  let merged = {};
  for (const options of optionsList) {
    if (options) {
      merged = mergeTwoOptions(merged, options);
    }
  }
  return merged;
}

function mergeTwoOptions(merged, overrides) {
  return Object.assign(merged, {
    ...overrides,
    templates: { ...merged.templates, ...overrides.templates },
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
    params[key] = value === '' ? true : value;
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
      params[key.substring(5)] = value === '' ? true : value;
    } else if (key === 'q') {
      params.q = value;
    }
  }
  return params;
}