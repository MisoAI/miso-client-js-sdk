---
---

{% raw %}
<h1 class="hero-title">Miso Answers</h1>
<div id="miso-ask-combo" class="miso-ask-combo"></div>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  const client = new MisoClient(window.DEFAULT_ASK_API_KEY);
  await client.ui.ready;
  const { templates, wireFollowUps, wireRelatedResources } = MisoClient.ui.defaults.ask;
  const rootElement = document.querySelector('#miso-ask-combo');
  // 1. suppose user has a custom root template with uses <div> instead of <miso-follow-ups>
  rootElement.innerHTML = templates.root().replaceAll('miso-follow-ups', 'div');
  // 2. suppose user has a custom follow-up template
  wireFollowUps(client, rootElement.querySelector(`.miso-ask-combo__follow-ups`), {
    template: options => templates.followUp(options).replace('<miso-ask', `<h3>${options.x}</h3><miso-ask`),
    x: 'hello'
  });
  wireRelatedResources(client, rootElement.querySelector(`.miso-ask-combo__related-resources`));
  client.ui.ask.autoQuery();
});
</script>
{% endraw %}
