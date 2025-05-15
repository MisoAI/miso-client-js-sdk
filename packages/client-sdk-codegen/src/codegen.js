import { ui } from './ui/index.js';
import Output from './output.js';

export function codegen({ schema = 'ui', ...options } = {}) {
  switch (schema) {
    case 'ui':
      return new Output(ui(options));
    default:
      throw new Error(`Unrecognized schema: "${schema}"`);
  }
}
