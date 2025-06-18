import { kebabToLowerCamel } from '@miso.ai/commons';
import { toName } from './utils.js';
import { WORKFLOW_SLUGS } from './workflows.slug.js';
import features from './features.js';
import * as presets from './presets.js';
import { default as sdks } from './sdks.js';

function getFeatures(features, slug) {
  return Object.values(features).filter(feature => feature.workflows.includes(slug));
}

function getPresets(presets, slug) {
  return Object.entries(presets[kebabToLowerCamel(slug)] || {}).map(([key, value]) => Object.freeze({
    slug: key,
    name: toName(key),
    value,
  }));
}

export default WORKFLOW_SLUGS.reduce((obj, slug) => {
  obj[slug] = Object.freeze({
    slug,
    name: toName(slug),
    features: getFeatures(features, slug),
    presets: getPresets(presets, slug),
    sdks,
  });
  return obj;
}, {});
