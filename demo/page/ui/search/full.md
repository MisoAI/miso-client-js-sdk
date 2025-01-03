---
---

{% raw %}
<style>
section {
  padding: 1rem;
}
.info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
</style>
<section>
  <miso-search>
    <miso-query></miso-query>
  </miso-search>
  <miso-search visible-when="loading ready">
    <div class="info">
      <div class="keywords">You searched for “<miso-keywords></miso-keywords>”</div>
      <div class="hits"><miso-hits></miso-hits> Results</div>
    </div>
    <miso-facets></miso-facets>
    <miso-products></miso-products>
  </miso-search>
</section>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(() => {
  MisoClient.plugins.use('std:ui');
  const client = new MisoClient('...');
  const workflow = client.ui.search;
  workflow.useApi('search', { rows: 10 });
  workflow.autocomplete.enable();
});
</script>
{% endraw %}
