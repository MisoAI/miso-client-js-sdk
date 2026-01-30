---
---

{% include './_root.md' %}
{% raw %}
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  MisoClient.plugins.use('std:ui');
  const client = new MisoClient({
    apiKey: '...',
    apiHost: 'http://localhost:9901/api',
  });
  const workflow = client.ui.explore;
  workflow.useApi({
    product_id: 'aaa',
  });
  workflow.useLink(false);
  workflow.on('select', ({ question }) => {
    workflow.trackers.related_questions.click([question.text]);
    alert(`You selected: ${question.text}`);
  });
  workflow.on('query', ({ q }) => {
    alert(`Your input: ${q}`);
  });
  workflow.start();
});
</script>
{% endraw %}
