---
---

{% raw %}
<h1 class="hero-title">Miso Answers</h1>
<div id="miso-ask-combo" class="miso-ask-combo"></div>
<script>
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function renderArticle(layout, state, data, meta) {
  return `<a class="miso-list__item-body" data-role="item" href="${data.url}" target="_blank" rel="noopener nofollow">
  <div class="miso-list__item-cover-image-container">
    <img class="miso-list__item-cover-image" src="${data.cover_image}">
  </div>
  <div class="miso-list__item-info-container">
    <div class="miso-list__item-title">${data.title}</div>
    <div class="miso-list__item-desc">${data.description}</div>
    <div class="miso-list__item-date">${formatDate(data.published_at)} | ${data.brand}</div>
  </div>
</a>`;
}
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  const client = new MisoClient({
    apiKey: window.DEFAULT_WHITEPAPER_ASK_API_KEY,
  });
  client.ui.asks.useLayouts({
    affiliation: ['list', {
      incremental: true,
      itemType: 'article',
      templates: {
        article: renderArticle,
      },
    }],
  });
  client.ui.asks.useDataProcessor(data => {
    if (!data.value || !data.value.affiliation || !data.value.affiliation.products) {
      return data;
    }
    return {
      ...data,
      value: {
        ...data.value,
        affiliation: {
          ...data.value.affiliation,
          products: data.value.affiliation.products.slice(0, 1),
        },
      }
    };
  });
  await client.ui.ready;
  const { templates } = MisoClient.ui.defaults.ask;
  const rootElement = document.querySelector('#miso-ask-combo');
  const affiliationPhrase = `<h4 class="miso-ask-combo__phrase miso-ask-combo_affiliation-phrase">Learn more: in-depth</h4>`
  rootElement.innerHTML = templates.root().replace('<miso-affiliation>', affiliationPhrase + '<miso-affiliation>');
  client.ui.ask.autoQuery();
});
</script>
{% endraw %}
