import { resolvePreset } from '../spec/index.js';
import { misocmd, createClient } from '../template/index.js';
import { autoQuery } from '../template/features.js';

// TODO: refactor these
function normalizeOptions({ facets, ...options } = {}) {
  if (facets === true) {
    facets = ['categories'];
  }
  return {
    ...options,
    facets,
  };
}

export function hybridSearch(options) {
  options = normalizeOptions(resolvePreset(options));
  const items = [
    {
      type: 'html',
      name: 'HTML',
      content: html(options),
    },
    {
      type: 'js',
      name: 'JavaScript',
      content: js(options),
    },
  ];
  return items;
}

function js(options) {
  // TODO: support loading from Node module
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
  return `<div id="miso-hybrid-search-combo" class="miso-hybrid-search-combo"></div>`.trim();
}
