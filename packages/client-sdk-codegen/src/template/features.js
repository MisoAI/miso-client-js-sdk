import { format } from './helpers.js';

/**
 * @param {boolean | object} options
 * - false => ''
 * - object => `workflow.useFacets({ ... });`
 */
export function facets(options) {
  return options ? `workflow.useFacets(${format(options, { multiline: true })});` : '';
}

/**
 * @param {boolean | object} options
 * - false => ''
 * - true => `workflow.autoQuery();`
 * - object => `workflow.autoQuery({ ... });`
 */
export function autoQuery(options) {
  return options ? `workflow.autoQuery(${typeof options === 'object' ? format(options, { multiline: true }) : ''});` : '';
}
