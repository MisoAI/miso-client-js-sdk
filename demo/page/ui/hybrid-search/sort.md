{% raw %}
<h1 class="hero-title">Miso Hybrid Search</h1>
<div id="miso-hybrid-search-combo" class="miso-hybrid-search-combo"></div>
<style>
.miso-hybrid-search-combo__search-results-filters {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}
.miso-hybrid-search-combo__search-results-filters__sort-header {
  font-size: 1.2rem;
  text-transform: capitalize;
}
.miso-hybrid-search-combo__search-results-filters__right,
.miso-hybrid-search-combo__search-results-filters__left {
  display: flex;
  flex-direction: column;
  justify-content: start;
  gap: 0.5rem;
}
.miso-hybrid-search-combo__search-results-filters__right {
  min-width: 8rem;
}
</style>
<script>
function insertSortElement(html) {
  return html.replace('<miso-facets></miso-facets>', `<div class="miso-hybrid-search-combo__search-results-filters__left"><miso-facets></miso-facets></div><div class="miso-hybrid-search-combo__search-results-filters__right"><div class="miso-hybrid-search-combo__search-results-filters__sort-header">Sort</div><miso-sort></miso-sort></div>`);
}
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  // setup client
  const MisoClient = window.MisoClient;
  const client = new MisoClient(window.DEFAULT_ASK_API_KEY);
  const workflow = client.ui.hybridSearch;
  workflow.useApi({
    facets: ['categories'],
  });
  workflow.useFilters({
    sort: {
      options: [
        { field: 'relevance', text: 'Relevance', default: true },
        { field: 'published_at', text: 'Date' },
      ],
    },
  });
  workflow.autocomplete.enable();
  // render DOM and get elements
  await client.ui.ready;
  const { templates, wireAnswerBox } = MisoClient.ui.defaults.hybridSearch;
  const rootElement = document.querySelector('#miso-hybrid-search-combo');
  rootElement.innerHTML = insertSortElement(templates.root());
  wireAnswerBox(client, rootElement);
  // start query if specified in URL
  workflow.autoQuery();
});
</script>
{% endraw %}
