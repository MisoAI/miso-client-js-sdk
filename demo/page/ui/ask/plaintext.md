---
---

{% include './_root.md' %}
{% raw %}
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(() => {
  // TODO: better timing management
  window.helpers.doggo.config({
    answer: { format: 'plaintext' }
  });
  const client = new MisoClient({
    apiKey: '...',
    apiHost: 'http://localhost:9901/api',
  });
  const workflow = client.ui.ask;
  workflow.useLayouts({
    answer: {
      format: 'plaintext',
    },
  });
  await client.ui.ready;
  window.rootElement.innerHTML = window.templates.root();
});
</script>
{% endraw %}
