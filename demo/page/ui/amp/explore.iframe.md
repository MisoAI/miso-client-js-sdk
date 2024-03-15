{% raw %}
<script async src="http://localhost:10099/dist/umd/miso.js"></script>
<style>
  .miso-explore-combo {
    max-width: 40rem;
    padding: 1.5rem;
    padding-top: 1rem;
    margin: 1rem;
    background-color: #eef;
    border-radius: 0.5rem;
  }
  .miso-explore-combo miso-related-questions {
    display: block;
    margin-bottom: 1rem;
    line-height: 1.5;
  }
  .miso-explore-combo miso-related-questions .miso-list__item {
    margin-bottom: 0.5em;
  }
  .miso-explore-combo .miso-explore-combo__related-questions-phrase {
    margin-bottom: 0.5rem;
    font-size: 1.5rem;
    font-weight: 500;
    line-height: 1.5;
  }
</style>
<div class="miso-explore-combo">
  <miso-explore visible-when="ready">
    <h3 class="miso-explore-combo__phrase miso-explore-combo__related-questions-phrase">Related questions</h3>
    <miso-related-questions></miso-related-questions>
    <miso-query></miso-query>
  </miso-explore>
</div>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  MisoClient.plugins.use('std:ui');
  await MisoClient.plugins.install('std:lorem');
  const client = new MisoClient({
    apiKey: '...',
  });
  const workflow = client.ui.explore;
  workflow.useApi({
    product_id: 'aaa',
  });
  workflow.useLink(question => `http://localhost:10100/ui/ask-combo/default/?q=${encodeURIComponent(question)}`);
  workflow.start();
});
</script>
{% endraw %}
