import { resolvePreset } from '../utils.js';
import { misocmd, createClient, pw } from '../templates.js';
import { facets, autoQuery } from '../features.js';

export const searchPresets = Object.freeze({
  standard: Object.freeze({
    workflow: 'search',
    autoQuery: true,
    autocomplete: true,
    //facets: ['categories'],
  }),
});

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
  options = normalizeOptions(resolvePreset(searchPresets, options));
  return {
    js: js(options),
    html: html(options),
  };
}

function js(options) {
  return misocmd(`
${options._pw ? pw() : ''}

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
