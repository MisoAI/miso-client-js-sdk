import { kebabOrSnakeToHuman } from '@miso.ai/commons';
import { resolveWorkflows } from './workflows.slug.js';

export const features = [
  {
    slug: 'use-api',
    workflows: '*',
  },
  {
    slug: 'use-link',
    workflows: 'ahes',
  },
  {
    slug: 'autocomplete',
    workflows: 'hs',
  },
  {
    slug: 'pagination',
    workflows: 'hs',
  },
  {
    slug: 'facets',
    workflows: 'hs',
  },
  {
    slug: 'follow-up',
    workflows: 'a',
  },
  {
    slug: 'auto-query',
    workflows: 'ahes',
  },
].map(({ slug, workflows, ...feature }) => ({
  slug,
  name: kebabOrSnakeToHuman(slug),
  workflows: resolveWorkflows(workflows),
  ...feature,
}));

export function getFeatures(workflow) {
  return features.filter(feature => feature.workflows.includes(workflow));
}
