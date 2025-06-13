import { resolvePreset } from '../spec/index.js';
import { misocmd, createClient, helpers as h } from '../template/index.js';
import { autoQuery, autocomplete } from '../template/features.js';

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
  return misocmd(h.paragraphs(
    client(options),
    workflow(options),
    setup(options),
    views(options),
    autoQuery(options.autoQuery),
  ));
}

function client(options) {
  return `
// access Miso client
${createClient(options)}`;
}

function workflow(options) {
  return `
// access workflow
const workflow = client.ui.hybridSearch;`;
}

function setup(options) {
  const items = [];
  const useApiCall = useApi(options);
  if (useApiCall) {
    items.push(useApiCall);
  }
  if (options.autocomplete) {
    items.push(autocomplete(options.autocomplete));
  }
  return items.length ? h.blocks(`// setup`, ...items) : '';
}

function useApi(options) {
  const params = {};
  if (options.facets) {
    params.facets = options.facets;
  }
  return Object.keys(params).length ? `workflow.useApi(${h.format(params, { multiline: true })});` : '';
}

function views(options) {
  if (options.elements === false) {
    return '';
  }
  const templatesHelpersUsed = [`templates`];
  let templatesRootParams = undefined;
  if (options.answerBox) {
    templatesHelpersUsed.push(`wireAnswerBox`);
    templatesRootParams = { ...templatesRootParams, answerBox: true };
  }
  return `
// render Miso elements
await client.ui.ready;
const { ${templatesHelpersUsed.join(', ')} } = MisoClient.ui.defaults.hybridSearch;
const rootElement = document.querySelector('#miso-hybrid-search-combo');
rootElement.innerHTML = templates.root(${h.format(templatesRootParams)});
${options.answerBox ? `wireAnswerBox(client, rootElement);` : ''}
`.trim();
}

function html(options) {
  if (options.elements === false) {
    return '';
  }
  return `<div id="miso-hybrid-search-combo" class="miso-hybrid-search-combo"></div>`.trim();
}
