import { kebabOrSnakeToHuman } from '@miso.ai/commons';
import { WORKFLOW_SLUGS } from './workflows.slug.js';
import { getFeatures } from './features.js';

export const workflows = WORKFLOW_SLUGS.map(slug => ({
  slug,
  name: kebabOrSnakeToHuman(slug),
  features: getFeatures(slug),
}));
