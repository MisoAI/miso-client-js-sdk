---
---

{% include './_root.md' %}
{% raw %}
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  await MisoClient.plugins.install('std:lorem');
  const client = new MisoClient({
    apiKey: '...',
  });
  await client.ui.ready;
  window.rootElement.innerHTML = window.templates.root();
});
</script>
{% endraw %}
