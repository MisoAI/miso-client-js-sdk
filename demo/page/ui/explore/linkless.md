---
---

{% raw %}
<style>
miso-related-questions ul {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  list-style: none;
  padding: 0;
  margin: 0;
}
miso-related-questions [data-role="item"] {
  padding: 0.5rem 1rem;
  border: 1px solid #999;
  border-radius: 9999px;
  cursor: pointer;
}
miso-related-questions [data-role="item"]:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background-color: var(--color-primary-l7);
}
</style>
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
  const client = new MisoClient({
    apiKey: '...',
    apiHost: 'http://localhost:9901/api',
  });
  const workflow = client.ui.explore;
  workflow.useApi({
    product_id: 'aaa',
  });
  workflow.useLink(false);
  workflow.on('select', ({ question }) => {
    workflow.trackers.related_questions.click([question.text]);
    alert(`You selected: ${question.text}`);
  });
  workflow.start();
});
</script>
{% endraw %}
