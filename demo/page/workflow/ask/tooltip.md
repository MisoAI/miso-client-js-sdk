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
  function onCitationLink({ addClass, setAttribute, setHref, setTooltipHtml, escapeHtml }, { source, index }) {
    addClass('my-custom-class');
    setHref((href) => {
      const url = new URL(href, window.location.href);
      url.searchParams.set('utm_source', 'miso');
      return url.href;
    });
    if (source) {
      setAttribute('data-title', source.title);
      const date = new Date(source.published_at).toLocaleDateString();
      setTooltipHtml(`<span class="title">${escapeHtml(source.title)}</span><span class="date">${date}</span>`);
    }
  }
  const context = client.ui.asks;
  context.useLayouts({
    answer: {
      onCitationLink,
    },
  });
  const rootWorkflow = client.ui.ask;
  await client.ui.ready;
  const { templates } = MisoClient.ui.defaults.ask;
  const rootElement = document.querySelector('#miso-ask-combo');
  rootElement.innerHTML = templates.root();
  rootWorkflow.autoQuery();
});
</script>
{% endraw %}
