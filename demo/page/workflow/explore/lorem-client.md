---
---

{% include './_root.md' %}
{% raw %}
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  MisoClient.plugins.use('std:ui');
  await MisoClient.plugins.install('std:lorem');
  const client = new MisoClient({
    apiKey: '...',
  });
  const workflow = client.ui.explore;
  workflow.useApi({
    product_id: 'aaa',
  });
  workflow.useLink(question => `http://localhost:10100/workflow/ask/production/?q=${encodeURIComponent(question)}`);
  workflow.start();
});
</script>
{% endraw %}
