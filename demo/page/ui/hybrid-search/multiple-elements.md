{% raw %}
<style>
.columns {
  display: flex;
  width: 100%;
  position: relative;
}
.columns > * {
  flex: 1;
  max-width: 50%;
}
</style>
<h1 class="hero-title">Miso Hybrid Search</h1>
<div class="columns">
  <div id="miso-hybrid-search-combo-0" class="miso-hybrid-search-combo"></div>
  <div id="miso-hybrid-search-combo-1" class="miso-hybrid-search-combo"></div>
</div>
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
  document.querySelector('#miso-hybrid-search-combo-0').innerHTML = templates.root();
  document.querySelector('#miso-hybrid-search-combo-1').innerHTML = templates.root();
  // start query if specified in URL
  workflow.autoQuery();
});
</script>
{% endraw %}
