import { hybridSearch } from './hybrid-search.js';
import { search } from './search.js';

const WORKFLOWS = {
  ['hybrid-search']: hybridSearch,
  search,
};

function normalizeOptions({ apiKey = 'your_api_key', ...options } = {}) {
  if (!options.workflow) {
    throw new Error('Workflow is required');
  }
  return {
    apiKey,
    ...options,
  };
}

export function ui(options) {
  options = normalizeOptions(options);
  const { workflow } = options;
  if (!WORKFLOWS[workflow]) {
    throw new Error(`Workflow "${workflow}" is not found`);
  }
  return WORKFLOWS[workflow](options);
}
