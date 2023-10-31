---
---

{% raw %}
<section>
  <h4>Related questions</h4>
  <miso-explore>
    <miso-related-questions></miso-related-questions>
  </miso-explore>
</section>
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
  workflow.useLink(question => `https://dummy.miso.ai/ask?q=${encodeURIComponent(question)}`);
  workflow.start();
});
</script>
{% endraw %}
