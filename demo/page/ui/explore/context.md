---
---

{% include './_root.md' %}
{% raw %}
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(() => {
  MisoClient.plugins.use('std:ui');
  const client = new MisoClient(window.DEFAULT_ASK_API_KEY);
  client.context.user_id = 'user-123';
  client.context.user_type = 'registered';
  client.context.site = 'my-site';
  const workflow = client.ui.explore;
  workflow.useApi({
    product_id: window.DEFAULT_PRODUCT_ID || 'aaa',
    _meta: {
      test: 'x',
    },
  });
  workflow.useLink(question => `http://localhost:10100/ui/ask-combo/default/?q=${encodeURIComponent(question)}`);
  workflow.start();
});
</script>
{% endraw %}
