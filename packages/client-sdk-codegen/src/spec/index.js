import { presets as hybridSearchPresets } from '../workflow/hybrid-search.js';

export const presets = Object.freeze({
  hybridSearch: Object.keys(hybridSearchPresets),
});
