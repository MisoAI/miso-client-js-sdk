---
---

{% raw %}
<h1 class="hero-title">Miso Answers</h1>
<div id="miso-ask-combo" class="miso-ask-combo"></div>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  const { searchParams } = new URL(window.location.href);
  const apiKey = searchParams.get('key') || window.DEFAULT_ASK_API_KEY;
  const questionId = searchParams.get('qid');
  const client = new MisoClient(apiKey);
  await client.ui.ready;
  const { templates, wireFollowUps, wireRelatedResources } = MisoClient.ui.defaults.ask;
  const rootElement = document.querySelector('#miso-ask-combo');
  rootElement.innerHTML = templates.root();
  wireFollowUps(client, rootElement.querySelector(`.miso-ask-combo__follow-ups`));
  wireRelatedResources(client, rootElement.querySelector(`.miso-ask-combo__related-resources`));
  if (questionId) {
    client.ui.ask.query({ questionId });
  }
});
</script>
{% endraw %}
