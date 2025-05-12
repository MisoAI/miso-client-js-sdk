import { hybridSearch } from './hybrid-search.js';
import { search } from './search.js';

const workflows = {
  hybridSearch,
  search,
};

function normalizeOptions({ workflow, ...options } = {}) {
  // turn workflow into camel case
  if (!workflow) {
    throw new Error('Workflow is required');
  }
  workflow = workflow.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

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
