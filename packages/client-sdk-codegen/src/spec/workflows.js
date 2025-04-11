import { kebabOrSnakeToHuman } from '@miso.ai/commons';

export const WORKFLOWS = ([
  {
    slug: 'ask',
  },
  {
    slug: 'hybrid-search',
  },
  {
    slug: 'explore',
  },
  {
    slug: 'search',
  },
  {
    slug: 'recommendation',
  },
]).map(workflow => ({
  ...workflow,
  name: kebabOrSnakeToHuman(workflow.slug),
}));

const ABV_TO_WORKFLOW = WORKFLOWS.reduce((map, workflow) => {
  map[workflow.slug.charAt(0)] = workflow;
  return map;
}, {});

export function resolveWorkflows(abvs) {
  if (abvs === '*') {
    return [...WORKFLOWS];
  }
  return abvs.split('').map(abv => {
    if (!ABV_TO_WORKFLOW[abv]) {
      throw new Error(`Workflow "${abv}" is not found`);
    }
    return ABV_TO_WORKFLOW[abv];
  });
}
