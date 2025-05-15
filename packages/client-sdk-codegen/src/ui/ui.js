import { hybridSearch } from './hybrid-search.js';
import { search } from './search.js';

const workflows = {
  ['hybrid-search']: hybridSearch,
  search,
};

function normalizeOptions({ workflow, ...options } = {}) {
  if (!workflow) {
    throw new Error('Workflow is required');
  }
  return {
    workflow,
    ...options,
  };
}

export function ui(options) {
  options = normalizeOptions(options);
  const { workflow } = options;
  if (!workflows[workflow]) {
    throw new Error(`Workflow "${workflow}" is not found`);
  }
  return workflows[workflow](options);
}
