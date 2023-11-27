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
    const { question_id } = await api.ask.questions(payload);
    const start = Date.now();
    let intervalId;
    intervalId = setInterval(async () => {
      const elapsed = Date.now() - start;
      if (elapsed > 5000) {
        clearInterval(intervalId);
        const error = new Error(`Emulated timeout: ${elapsed / 1000} seconds`);
        workflow.updateData({ session, error });
        return;
      }
      const value = await api.ask.answer(question_id);
      value.finished && clearInterval(intervalId);
      workflow.updateData({ session, value });
    }, 1000);
  });
  await client.ui.ready;
  const { templates } = MisoClient.ui.defaults.ask;
  const rootElement = document.querySelector('#miso-ask-combo');
  rootElement.innerHTML = templates.root();
});
</script>
{% endraw %}
