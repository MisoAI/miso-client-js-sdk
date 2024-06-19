import { loadStyles as _loadStyles, resolveCssUrl } from '@miso.ai/commons';

const NAME = 'markdown';

let cssUrl;
let stylesLoaded;

export async function loadStyles() {
  return stylesLoaded || (stylesLoaded = _loadStyles(getCssUrl()));
}

// helpers //
function getCssUrl() {
  return cssUrl || (cssUrl = resolveCssUrl(NAME));
}
