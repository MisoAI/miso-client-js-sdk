import { loadStyles, resolveCssUrl } from '@miso.ai/commons';

const NAME = 'ui';

let cssUrl;
let stylesLoaded;

export async function loadStylesIfNecessary() {
  return stylesLoaded || (stylesLoaded = loadStyles(getCssUrl()));
}

// helpers //
function getCssUrl() {
  return cssUrl || (cssUrl = resolveCssUrl(NAME));
}
