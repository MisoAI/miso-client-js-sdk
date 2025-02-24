---
---

{% raw %}
<h1 class="hero-title">Miso Answers</h1>
<div id="miso-ask-combo" class="miso-ask-combo"></div>
<script src="https://www.unpkg.com/@miso.ai/doggoganger@beta/dist/umd/doggoganger-browser.min.js"></script>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  const client = new MisoClient({
    apiKey: '...',
    apiHost: 'http://localhost:9901/api',
  });
  const workflow = client.ui.ask;
  workflow.useApi(false);
  const api = window.doggoganger.buildApi();
  workflow.on('request', async ({ session, payload }) => {
    workflow.updateData({ session });
    const headResponse = await api.ask.questions(payload);
    const { question_id } = headResponse;
    workflow.updateData({ session, value: headResponse });
    let intervalId;
    intervalId = setInterval(async () => {
      const value = await api.ask.answer(question_id);
      value.finished && clearInterval(intervalId);
      workflow.updateData({ session, value });
    }, 1000);
  });
  await client.ui.ready;
  const { templates, wireFollowUps, wireRelatedResources } = MisoClient.ui.defaults.ask;
  const rootElement = document.querySelector('#miso-ask-combo');
  rootElement.innerHTML = templates.root();
  wireFollowUps(client, rootElement.querySelector(`.miso-ask-combo__follow-ups`));
  wireRelatedResources(client, rootElement.querySelector(`.miso-ask-combo__related-resources`));
});
</script>
{% endraw %}
