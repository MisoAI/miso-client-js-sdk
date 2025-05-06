import { hybridSearchPresets } from '../workflow/hybrid-search.js';
import { searchPresets } from '../workflow/search.js';

export const presets = Object.freeze({
  hybridSearch: Object.keys(hybridSearchPresets),
  search: Object.keys(searchPresets),
});
