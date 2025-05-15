import { toName } from './utils.js';
import { resolveWorkflows } from './workflows.slug.js';

export default [
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
].reduce((map, { slug, workflows, ...rest }) => {
  map[slug] = Object.freeze({
    slug,
    name: toName(slug),
    workflows: resolveWorkflows(workflows),
    ...rest,
  });
  return map;
}, {});
