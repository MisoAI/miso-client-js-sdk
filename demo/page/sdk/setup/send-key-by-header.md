---
---

<h3>Send API key by header</h3>
<p>Send API key by header</p>
<screen name="header"></screen>

{% raw %}
<script>
MisoClient.plugins.use("std:header-api-key");
const client = new MisoClient({});
show(
  'header',
  () => client.api.search.search({ q: 'shiba' })
);
</script>
{% endraw %}
