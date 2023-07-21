---
---

<h3>Custom header</h3>
<p>Custom header</p>
<screen name="header"></screen>

{% raw %}
<script>
const _fetch = window.fetch;
window.fetch = (url, { headers, ...options }) => {
  return _fetch(url, {
    ...options,
    headers: {
      ...headers,
      'content-type': 'application/json',
      'x-custom-header': 'custom-value',
    },
  });
};

const client = new MisoClient();

show(
  'header',
  () => client.api.search.search({ q: 'shiba' })
);
</script>
{% endraw %}
