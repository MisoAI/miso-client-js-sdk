import { presets } from '../spec/index.js';
import { resolvePreset } from '../template/helpers.js';
import { misocmd, createClient } from '../template/index.js';
import { autoQuery } from '../template/features.js';

export function hybridSearch(options) {
  options = resolvePreset(presets.hybridSearch, options);
  return {
    js: js(options),
    html: html(options),
  };
}

function js(options) {
  // TODO: useLink
  return misocmd(`
// client
${createClient(options)}

// workflow
const workflow = client.ui.hybridSearch;

// setup: TODO

${jsElements(options)}

${autoQuery(options.autoQuery)}
`);
}

function jsElements(options) {
  if (options.elements === false) {
    return '';
  }
  return `
// render Miso elements
await client.ui.ready;
const { templates, wireAnswerBox } = MisoClient.ui.defaults.hybridSearch;
const rootElement = document.querySelector('#miso-hybrid-search-combo');
rootElement.innerHTML = templates.root();
wireAnswerBox(client, rootElement);
`.trim();
}

function html(options) {
  if (options.elements === false) {
    return '';
  }
  return `
<h1 class="hero-title">Miso Hybrid Search</h1>
<div id="miso-hybrid-search-combo" class="miso-hybrid-search-combo"></div>
`.trim();
}
