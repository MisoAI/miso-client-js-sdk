---
---

<h3>Timeout</h3>
<p>Set timeout = 1 ms and expect a user abort error.</p>
<screen name="timeout"></screen>

{% raw %}
<script>
const client = new MisoClient({
  request: {
    timeout: 1,
  },
});

show(
  'timeout',
  () => client.api.search.search({ q: 'shiba' })
);
</script>
{% endraw %}
