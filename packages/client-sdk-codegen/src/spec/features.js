import { resolveWorkflows } from './workflows.js';

export const FEATURES = [
  {
    slug: 'use-api',
    name: 'useApi()',
    workflows: resolveWorkflows('*'),
  },
  {
    slug: 'use-link',
    name: 'useLink()',
    workflows: resolveWorkflows('ahes'),
  },
  {
    slug: 'follow-up',
    name: 'Follow Up',
    workflows: resolveWorkflows('a'),
  },
  {
    slug: 'auto-query',
    name: 'Auto Query',
    workflows: resolveWorkflows('ahes'),
  },
  {
    slug: 'autocomplete',
    name: 'Autocomplete',
    workflows: resolveWorkflows('hs'),
  },
  {
    slug: 'pagination',
    name: 'Pagination',
    workflows: resolveWorkflows('hs'),
  },
  {
    slug: 'facets',
    name: 'Facets',
    workflows: resolveWorkflows('hs'),
  },
];

export function getFeatures(workflow) {
  return FEATURES.filter(feature => feature.workflows.includes(workflow));
}
