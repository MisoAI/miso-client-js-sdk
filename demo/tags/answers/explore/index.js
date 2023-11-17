const { doggoganger } = window;
const paramsFromUrl = normalizeParamsFromUrl(Object.fromEntries(new URLSearchParams(window.location.search).entries()));
const envParams = getEnvParams(paramsFromUrl);

const elements = {
  article: {
    title: document.querySelector('#article .title'),
    body: document.querySelector('#article .body'),
  }
};

const { article: product_id } = paramsFromUrl;

renderArticle(generateArticle(product_id));

(window.misocmd || (window.misocmd = [])).push(() => start(product_id));

function renderArticle({ authors, title, html }) {
  elements.article.title.innerHTML = title;
  elements.article.body.innerHTML = html;
}

async function start(product_id) {
  const { debug, api_key, api_host } = envParams;
  const MisoClient = window.MisoClient;

  if (debug !== undefined) {
    MisoClient.plugins.use('std:debug');
  }
  MisoClient.plugins.use('std:ui');

  if (api_key.toLowerCase() === 'lorem') {
    await MisoClient.plugins.install('std:lorem');
  }

  //displayVersionInfo(MisoClient);

  const options = { apiKey: api_key };
  if (api_host) {
    options.apiHost = `https://${api_host}/v1`;
  }
  const client = new MisoClient(options);
  const workflow = client.ui.explore;
  workflow.useApi({ product_id });
  workflow.useLink(getLink);
  workflow.start();
}

function getLink(question) {
  return `../answers/?${toSearchString({ ...envParams, q: question })}`;
}

// helpers //
function normalizeParamsFromUrl({
  article = doggoganger.data.utils.id(),
  api_key = 'lorem',
  ...params
}) {
  return syncParamsToUrl({
    article,
    api_key,
    ...params,
  });
}

function syncParamsToUrl(params) {
  const url = new URL(window.location);
  url.search = toSearchString(params);
  window.history.replaceState({}, '', url);
  return params;
}

function getEnvParams({ api_key, api_host, debug, yearly_decay, fq }) {
  const params = { api_key };
  if (debug !== undefined) {
    params.debug = debug;
  }
  if (api_host !== undefined) {
    params.api_host = api_host;
  }
  if (yearly_decay !== undefined) {
    params.yearly_decay = yearly_decay;
  }
  if (fq !== undefined) {
    params.fq = fq;
  }
  return params;
}

function toSearchString(params) {
  return new URLSearchParams(params).toString(); // TODO: we want '&debug' rather than '&debug='
}

function generateArticle(product_id) {
  const article = doggoganger.data.articles({ rows: 1 }).next().value;
  return {
    ...article,
    product_id,
  };
}
