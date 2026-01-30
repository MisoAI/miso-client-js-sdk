---
---

{% include './_root.md' %}
{% raw %}
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(() => {
  MisoClient.plugins.use('std:ui');
  const client = new MisoClient(window.DEFAULT_ASK_API_KEY);
  const workflow = client.ui.explore;
  workflow.useApi('trending_questions', { rows: 5 });
  workflow.useLink(question => `http://localhost:10100/ui/ask-combo/default/?q=${encodeURIComponent(question)}`);
  workflow.start();
});
</script>
{% endraw %}
