---
---

{% raw %}
<h1 class="hero-title">Miso Answers</h1>
<div id="miso-ask-combo" class="miso-ask-combo"></div>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  MisoClient.plugins.use('std:debug', {
    preserveLog: true,
    logDownloadButtonText: 'Logs',
    logFilename: ({ timestamp }) => `demo-miso-log.${timestamp}.jsonl`,
  });
  const client = new MisoClient({
    apiKey: '...',
    apiHost: 'http://localhost:9901/api',
  });
  client.ui.asks.useLayouts({
    answer: { onDebug: true },
  });
  const workflow = client.ui.ask;
  await Promise.all([
    MisoClient.logs.showDownloadButton(),
    client.ui.ready,
  ]);
  const { templates, wireFollowUps, wireRelatedResources } = MisoClient.ui.defaults.ask;
  const rootElement = document.querySelector('#miso-ask-combo');
  rootElement.innerHTML = templates.root();
  wireFollowUps(client, rootElement.querySelector(`.miso-ask-combo__follow-ups`));
  wireRelatedResources(client, rootElement.querySelector(`.miso-ask-combo__related-resources`));
  workflow.autoQuery();
});
</script>
{% endraw %}
