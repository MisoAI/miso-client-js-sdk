---
---

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
  <miso-explore visible-when="nonempty">
    <h3 class="miso-explore-combo__phrase miso-explore-combo__related-questions-phrase">Related questions</h3>
    <miso-related-questions></miso-related-questions>
    <miso-query></miso-query>
  </miso-explore>
</div>
{% raw %}
<script>
const makeEmpty = new URL(window.location.href).searchParams.has('empty');
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(() => {
  MisoClient.plugins.use('std:ui');
  const client = new MisoClient(window.DEFAULT_ASK_API_KEY);
  const workflow = client.ui.explore;
  workflow.useApi({
    product_id: window.DEFAULT_PRODUCT_ID || 'aaa',
  });
  workflow.useLink(question => `http://localhost:10100/ui/ask-combo/default/?q=${encodeURIComponent(question)}`);
  makeEmpty && workflow.useDataProcessor(data => !data.value ? data : { ...data, value: { ...data.value, related_questions: [] } });
  workflow.start();
});
</script>
{% endraw %}
