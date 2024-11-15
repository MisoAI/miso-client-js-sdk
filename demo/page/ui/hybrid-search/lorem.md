{% raw %}
<h1 class="hero-title">Miso Answers</h1>
<div id="miso-hybrid-search-combo" class="miso-hybrid-search-combo"></div>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  // setup client
  const MisoClient = window.MisoClient;
  const client = new MisoClient({
    apiKey: '...',
    apiHost: 'http://localhost:9901/api',
  });
  const workflow = client.ui.hybridSearch;
  //client.context.user_id = 'id';
  //client.context.user_type = 'test';
  // render DOM and get elements
  await client.ui.ready;
  const { templates, wireAnswerBox } = MisoClient.ui.defaults.hybridSearch;
  const rootElement = document.querySelector('#miso-hybrid-search-combo');
  rootElement.innerHTML = templates.root();
  wireAnswerBox(client, rootElement);
  // start query if specified in URL
  workflow.autoQuery();
});
</script>
{% endraw %}
