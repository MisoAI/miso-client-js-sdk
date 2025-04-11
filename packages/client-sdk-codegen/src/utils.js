export function indent(str, level = 1) {
  return str.replace(/\n/g, '\n' + ' '.repeat(level));
}

/**
 * Format a JavaScript value to literal string
 * @param {*} value
 * @param {Object} options
 * @param {boolean} options.multiline - Whether to use multiline
 * @returns {string}
 */
export function format(value, { multiline = false } = {}) {
  // use single quote
  // no quote for simple key in object
  return JSON.stringify(value, null, multiline ? 2 : 0).replace(/"/g, "'").replace(/\s*:\s*/g, ': ');
}

/**
 * Resolve preset options
 * @param {Object} presets - Available presets
 * @param {Object} options - Options to resolve
 * @param {string} options.preset - Preset to use
 * @param {Object} options - Other options
 * @returns {Object} Resolved options
 */
export function resolvePreset(presets, { preset, ...options } = {}) {
  if (!preset) {
    return options;
  }
  if (!presets[preset]) {
    throw new Error(`Preset "${preset}" is not found`);
  }
  // let rest of options override
  return {
    ...presets[preset],
    ...options,
  };
}
