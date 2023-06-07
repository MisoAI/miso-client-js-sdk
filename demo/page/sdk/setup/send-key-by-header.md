---
---

<h3>Send API key by header</h3>
<p>Send API key by header</p>
<screen name="header"></screen>

{% raw %}
<script>
const client = new MisoClient({
  request: {
    sendApiKeyByHeader: true,
  },
});

show(
  'header',
  () => client.api.search.search({ q: 'shiba' })
);
</script>
{% endraw %}
