---
---

{% include './_root.md' %}
{% raw %}
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  const client = new MisoClient('...');
  await client.ui.ready;
  const { templates } = MisoClient.ui.defaults.ask;
  const rootElement = document.querySelector('#miso-ask-combo');
  rootElement.innerHTML = templates.root();
});
</script>
{% endraw %}
