---
---

{% include './_root.md' %}
{% raw %}
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  window.helpers.doggo.config({
    answer: { languages: ['js'] }
  });
  const client = new MisoClient({
    apiKey: '...',
    apiHost: 'http://localhost:9901/api',
  });
  const workflow = client.ui.ask;
  workflow.on('done', () => {
    Prism.highlightAllUnder(workflow._views.get('answer').element);
  });
  await client.ui.ready;
  window.rootElement.innerHTML = window.templates.root();
});
</script>
{% endraw %}
