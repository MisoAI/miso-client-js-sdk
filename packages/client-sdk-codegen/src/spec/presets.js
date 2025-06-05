import { kebabToLowerCamel, lowerCamelToKebab } from '@miso.ai/commons';

export const hybridSearch = Object.freeze({
  standard: Object.freeze({
    workflow: 'hybrid-search',
    autoQuery: true,
    autocomplete: true,
    facets: ['categories'],
    answerBox: true,
  }),
  minimal: Object.freeze({
    workflow: 'hybrid-search',
  }),
});

export const search = Object.freeze({
  standard: Object.freeze({
    workflow: 'search',
    autoQuery: true,
    autocomplete: true,
    //facets: ['categories'],
  }),
  minimal: Object.freeze({
    workflow: 'search',
  }),
});

const PRESETS = {
  ['hybrid-search']: hybridSearch,
  search,
};

export function resolvePreset({ workflow, preset, ...options } = {}) {
  if (!workflow) {
    throw new Error('Workflow is required');
  }
  workflow = lowerCamelToKebab(workflow); // just in case
  const presets = PRESETS[workflow];
  if (!presets) {
    throw new Error(`Workflow "${workflow}" presets not found`);
  }
  if (!preset) {
    return options;
  }
  if (!presets[preset]) {
    throw new Error(`Preset "${preset}" not found in workflow "${workflow}"`);
  }
  // let rest of options override
  return {
    workflow,
    ...presets[preset],
    ...options,
  };
}
