---
---

{% raw %}
<h1 class="hero-title">Miso Answers</h1>
<div id="miso-ask-combo" class="miso-ask-combo"></div>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  const client = new MisoClient({
    apiKey: window.DEFAULT_AFFILIATION_ASK_API_KEY,
  });
  client.ui.asks.useApi({
    user_id: 'simonpai',
    user_type: 'registered',
    cite_link: true,
    _env: 'production_sandbox',
  });
  client.ui.asks.useLayouts({
    affiliation: {
      templates: {
        logoUrl: '/img/miso-logo.svg',
      },
    },
  });
  await client.ui.ready;
  const { templates } = MisoClient.ui.defaults.ask;
  const rootElement = document.querySelector('#miso-ask-combo');
  rootElement.innerHTML = templates.root();
  client.ui.ask.autoQuery({
    updateUrl: true,
  });
});
</script>
{% endraw %}
