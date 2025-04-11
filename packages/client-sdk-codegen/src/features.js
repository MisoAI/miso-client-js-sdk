import { format } from './utils.js';

export function autoQuery(autoQuery) {
  return autoQuery ? `workflow.autoQuery(${typeof autoQuery === 'object' ? format(autoQuery, { multiline: true }) : ''});` : '';
}