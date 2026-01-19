---
---

{% raw %}
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(() => {
  MisoClient.plugins.use('std:analytics');
  const client = new MisoClient('...');
  client.analytics.start();
  setInterval(() => {
    console.log(client.analytics.state);
  }, 1000);
});
</script>
{% endraw %}
