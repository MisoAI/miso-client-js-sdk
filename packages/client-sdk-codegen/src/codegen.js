import { ui } from './ui/index.js';

export function codegen({ schema = 'ui', ...options } = {}) {
  switch (schema) {
    case 'ui':
      return ui(options);
    default:
      throw new Error(`Unrecognized schema: "${schema}"`);
  }
}
