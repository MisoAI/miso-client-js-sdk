---
---

{% include './_root.md' %}
{% raw %}
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
    const { question_id } = await api.ask.questions(payload);
    let intervalId;
    intervalId = setInterval(async () => {
      const value = await api.ask.answer(question_id);
      value.finished && clearInterval(intervalId);
      workflow.updateData({ session, value });
    }, 1000);
  });
  await client.ui.ready;
  window.rootElement.innerHTML = window.templates.root();
});
</script>
{% endraw %}
