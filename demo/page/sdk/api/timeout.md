---
---

<h3>Timeout</h3>
<p>Set timeout = 1 ms and expect a user abort error.</p>
<screen name="timeout-1ms"></screen>
<p>Set timeout = 100,000 ms.</p>
<screen name="timeout-100s"></screen>

{% raw %}
<script>
const client = new MisoClient('...');

show(
  'timeout-1ms',
  () => client.api.search.search({ q: 'shiba', fl: [] }, { timeout: 1 })
);
show(
  'timeout-100s',
  () => client.api.search.search({ q: 'shiba', fl: [] }, { timeout: 100000 })
);
</script>
{% endraw %}
