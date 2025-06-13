export function indent(str, level = 1) {
  const spaces = ' '.repeat(level);
  return str.split('\n').map(removeTrailingSpace).map(line => line ? spaces + line : '').join('\n');
}

/**
 * Format a JavaScript value to literal string
 * @param {*} value
 * @param {Object} options
 * @param {boolean} options.multiline - Whether to use multiline
 * @returns {string}
 */
export function format(value, { multiline = false, omitUndefined = true } = {}) {
  if (omitUndefined && value === undefined) {
    return '';
  }
  // use single quote
  // no quote for simple key in object
  return JSON.stringify(value, null, multiline ? 2 : 0).replace(/"/g, "'").replace(/\s*:\s*/g, ': ');
}

/**
 * Join blocks with proper newlines
 * @param {string[]} blocks - Blocks to join
 * @returns {string}
 */
export function blocks(...blocks) {
  return blocks
    .map(removeTrailingSpace)
    .map(removeStartingNewLine)
    .filter(block => block)
    .join('\n');
}

/**
 * Join paragraphs with proper newlines
 * @param {string[]} paragraphs - Paragraphs to join
 * @returns {string}
 */
export function paragraphs(...paragraphs) {
  return paragraphs
    .map(removeTrailingSpace)
    .map(removeStartingNewLine)
    .filter(paragraph => paragraph)
    .join('\n\n');
}

function removeTrailingSpace(str) {
  return str.replace(/\s+$/g, '');
}

function removeStartingNewLine(str) {
  // remove only leading newlines, preserve other leading whitespace
  return str.replace(/^[\r\n]+/g, '');
}
