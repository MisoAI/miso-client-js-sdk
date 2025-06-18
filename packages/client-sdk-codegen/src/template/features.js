import { format } from './helpers.js';

/**
 * @param {boolean | object} options
 * - false => ''
 * - true => `workflow.autoQuery();`
 * - object => `workflow.autoQuery({ ... });`
 */
export function autoQuery(options) {
  return options ? `// start query if URL parameter is present\nworkflow.autoQuery(${format(options === true ? undefined : options, { multiline: true })});` : '';
}

/**
 * @param {boolean} options
 * - false => ''
 * - true => `workflow.autocomplete.enable();`
 */
export function autocomplete(options) {
  return options ? `workflow.autocomplete.enable();` : '';
}
