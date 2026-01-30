{% raw %}
<h1 class="hero-title">Miso Hybrid Search</h1>
<div id="miso-hybrid-search-combo" class="miso-hybrid-search-combo">
  <miso-hybrid-search class="miso-hybrid-search-combo__query-container" logo="false">
    <miso-query></miso-query>
  </miso-hybrid-search>
</div>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  // setup client
  const MisoClient = window.MisoClient;
  const client = new MisoClient(window.DEFAULT_ASK_API_KEY);
  const workflow = client.ui.hybridSearch;
  workflow.useLink(q => `/ui/hybrid-search/production/?q=${q}`);
  // render DOM and get elements
  await client.ui.ready;
});
</script>
{% endraw %}
