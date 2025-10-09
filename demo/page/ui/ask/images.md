{% raw %}
<h1 class="hero-title">Miso Answers</h1>
<div id="miso-ask-combo" class="miso-ask-combo"></div>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  // setup client
  const MisoClient = window.MisoClient;
  const client = new MisoClient({
    apiKey: '...',
    apiHost: 'http://localhost:9901/api',
  });
  /*
  const client = new MisoClient(window.DEFAULT_ASK_API_KEY);
  client.ui.asks.useApi({
    _env: 'staging_sandbox',
  });
  */
  client.ui.asks.useLayouts({
    answer: {
      variant: ['slot', '<miso-images></miso-images>'],
    },
  });
  const rootWorkflow = client.ui.ask;
  // render DOM and get elements
  await client.ui.ready;
  const { templates } = MisoClient.ui.defaults.ask;
  const rootElement = document.querySelector('#miso-ask-combo');
  rootElement.innerHTML = templates.root();
  rootWorkflow.autoQuery();
});
</script>
{% endraw %}
