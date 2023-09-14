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
  const { debug, api_key } = paramsFromUrl;
  const MisoClient = window.MisoClient;

  if (debug !== undefined) {
    MisoClient.plugins.use('std:debug');
  }
  MisoClient.plugins.use('std:ui');

  if (api_key.toLowerCase() === 'lorem') {
    await MisoClient.plugins.install('std:lorem');
  }

  //displayVersionInfo(MisoClient);

  const client = new MisoClient(api_key);
  const workflow = client.ui.explore;
  workflow.productId = product_id;
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

function getEnvParams({ api_key, debug, yearly_decay, fq }) {
  const params = { api_key };
  if (debug !== undefined) {
    params.debug = debug;
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
