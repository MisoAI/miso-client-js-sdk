{% raw %}
<h1 class="hero-title">Miso Hybrid Search</h1>
<div id="miso-hybrid-search-combo" class="miso-hybrid-search-combo"></div>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  // setup client
  const MisoClient = window.MisoClient;
  const client = new MisoClient(window.DEFAULT_HYBRID_SEARCH_API_KEY || window.DEFAULT_ASK_API_KEY);
  const workflow = client.ui.hybridSearch;
  workflow.useApi({
    facets: ['categories'],
  });
  workflow.autocomplete.enable();
  // render DOM and get elements
  await client.ui.ready;
  const { templates } = MisoClient.ui.defaults.hybridSearch;
  const rootElement = document.querySelector('#miso-hybrid-search-combo');
  rootElement.innerHTML = templates.root();
  // start query if specified in URL
  workflow.autoQuery();
});
</script>
{% endraw %}
