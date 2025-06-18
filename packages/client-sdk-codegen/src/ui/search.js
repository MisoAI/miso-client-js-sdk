import { resolvePreset } from '../spec/index.js';
import { sdk, createClient, helpers as h } from '../template/index.js';
import { autoQuery } from '../template/features.js';

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
  options = normalizeOptions(resolvePreset(options));
  // TODO: extra styles for concatenate format
  const items = [];
  if (options.elements !== false) {
    items.push(
      {
        type: 'html',
        name: 'HTML (Search box)',
        content: htmlSearchBox(options),
      },
      {
        type: 'html',
        name: 'HTML (Results)',
        content: htmlResults(options),
      },
    );
  }
  items.push(
    {
      type: 'js',
      name: 'JavaScript',
      content: js(options),
    },
  );
  return items;
}

function js(options) {
  return sdk(options, h.paragraphs(
    client(options),
    workflow(options),
    setup(options),
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
const workflow = client.ui.search;`;
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

function autocomplete(options) {
  return options ? `workflow.autocomplete.enable();` : '';
}

function htmlSearchBox(options) {
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
