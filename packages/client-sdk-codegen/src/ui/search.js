import { presets } from '../spec/index.js';
import { resolvePreset } from '../template/helpers.js';
import { misocmd, createClient } from '../template/index.js';
import { facets, autoQuery } from '../template/features.js';

function normalizeOptions({ facets, ...options } = {}) {
  if (facets === true) {
    facets = ['categories'];
  }
  return {
    ...options,
    facets,
  };
}

export function search(options) {
  options = normalizeOptions(resolvePreset(presets.search, options));
  return {
    js: js(options),
    html: html(options),
  };
}

function js(options) {
  return misocmd(`
// client
${createClient(options)}

// workflow
const workflow = client.ui.search;

// setup: TODO
${facets(options.facets)}

${autoQuery(options.autoQuery)}
`);
}

function html(options) {
  if (options.elements === false) {
    return '';
  }
  return `
${htmlQuery(options)}
<hr>
${htmlResults(options)}
`.trim();
}

function htmlQuery(options) {
  return `
<miso-search>
  <miso-query></miso-query>
</miso-search>
`.trim();
}

function htmlResults(options) {
  // TODO: useLink
  return `
<miso-search visible-when="loading ready">
  <div class="info">
    <div class="keywords">You searched for “<miso-keywords></miso-keywords>”</div>
    <div class="total"><miso-total></miso-total> Results</div>
  </div>
  <miso-facets></miso-facets>
  <miso-products></miso-products>
</miso-search>
`.trim();
}
