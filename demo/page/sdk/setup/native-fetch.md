---
---

<h3>Native Fetch</h3>
<p>Use native fetch plugin to save your day from screwed up fetch function</p>
<screen name="fetch"></screen>

{% raw %}
<script>
window.fetch = () => {
  throw new Error('fetch is not defined');
};
MisoClient.plugins.use('std:native-fetch');
const client = new MisoClient({});

show(
  'fetch',
  () => client.api.search.search({ q: 'shiba' })
);
</script>
{% endraw %}
