---
---

{% raw %}
<h1 class="hero-title">Miso Answers</h1>
<div id="miso-ask-combo" class="miso-ask-combo"></div>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  MisoClient.plugins.use('std:dry-run');
  const client = new MisoClient(window.DEFAULT_ASK_API_KEY);
  client.context.user_id = 'user-123';
  client.context.user_type = 'registered';
  client.context.site = 'my-site';
  client.context.auth = 'Bearer 012345';
  client.ui.ask.useApi({
    _meta: {
      test: 'x',
    },
  });
  await client.ui.ready;
  const { templates, wireFollowUps, wireRelatedResources } = MisoClient.ui.defaults.ask;
  const rootElement = document.querySelector('#miso-ask-combo');
  rootElement.innerHTML = templates.root();
  wireFollowUps(client, rootElement.querySelector(`.miso-ask-combo__follow-ups`));
  wireRelatedResources(client, rootElement.querySelector(`.miso-ask-combo__related-resources`));
  client.ui.ask.autoQuery();
});
</script>
{% endraw %}
