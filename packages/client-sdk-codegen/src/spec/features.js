import { toName } from './utils.js';
import { resolveWorkflows } from './workflows.slug.js';

const DEFAULT_BOOLEAN_OPTIONS = [
  { name: 'Off', value: undefined },
  { name: 'On', value: true },
];

export default [
  /*
  {
    slug: 'use-api',
    workflows: '*',
  },
  */
  {
    slug: 'use-link',
    workflows: 'ahes',
    options: DEFAULT_BOOLEAN_OPTIONS,
  },
  {
    slug: 'autocomplete',
    workflows: 'hs',
    options: DEFAULT_BOOLEAN_OPTIONS,
  },
  {
    slug: 'pagination',
    workflows: 'hs',
    options: DEFAULT_BOOLEAN_OPTIONS,
  },
  {
    slug: 'facets',
    workflows: 'hs',
    options: [
      { name: 'Off', value: undefined },
      { name: 'Categories', value: ['categories'] },
    ],
  },
  {
    slug: 'follow-up',
    workflows: 'a',
    options: DEFAULT_BOOLEAN_OPTIONS,
  },
  {
    slug: 'auto-query',
    workflows: 'ahes',
    options: DEFAULT_BOOLEAN_OPTIONS,
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
