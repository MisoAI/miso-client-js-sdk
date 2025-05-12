import { format } from './helpers.js';

export function facets(options) {
  return options ? `workflow.useFacets(${format(options, { multiline: true })});` : '';
}

export function autoQuery(options) {
  // TODO: consider when options === false
  return options ? `workflow.autoQuery(${typeof options === 'object' ? format(options, { multiline: true }) : ''});` : '';
}
