---
---

{% raw %}
<style>
  .btn-group * {
    box-shadow: none !important;
  }
  #reload-btn {
    margin-left: 0.5em;
  }
</style>
<section>
  <miso-search-input>
  </miso-search-input>
</section>
<script>
</script>
<hr>
<section>
  <miso-search-results></miso-search-results>
</section>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(() => {
  MisoClient.plugins.use('std:ui');
  const client = new MisoClient('...');
  const search = client.ui.search;
  search.useApi({ rows: 10 });
  search.useLayout('list');
});
</script>
{% endraw %}
