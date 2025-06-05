export function indent(str, level = 1) {
  // TODO: trim and deal with blank lines
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
 * Join blocks with proper newlines
 * @param {string[]} blocks - Blocks to join
 * @returns {string}
 */
export function blocks(...blocks) {
  return blocks.map(block => block.trim()).filter(block => block).join('\n');
}

/**
 * Join paragraphs with proper newlines
 * @param {string[]} paragraphs - Paragraphs to join
 * @returns {string}
 */
export function paragraphs(...paragraphs) {
  return paragraphs.map(paragraph => paragraph.trim()).filter(paragraph => paragraph).join('\n\n');
}
