export const WORKFLOW_SLUGS = [
  'ask',
  'hybrid-search',
  'explore',
  'search',
  'recommendation',
];

const ABV_TO_WORKFLOW = WORKFLOW_SLUGS.reduce((map, slug) => {
  map[slug.charAt(0)] = slug;
  return map;
}, {});

export function resolveWorkflows(abvs) {
  if (abvs === '*') {
    return [...WORKFLOW_SLUGS];
  }
  return abvs.split('').map(abv => {
    if (!ABV_TO_WORKFLOW[abv]) {
      throw new Error(`Workflow "${abv}" is not found`);
    }
    return ABV_TO_WORKFLOW[abv];
  });
}
