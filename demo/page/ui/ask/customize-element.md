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
  .phrase {
    font-size: .875rem;
    line-height: 1.2;
    margin: 1rem auto;
    color: #999;
  }
  .miso-list {
    --miso-list-item-height: 7rem;
    --miso-list-item-gap: 0.65rem;
    --miso-list-description-lines: 3;
  }
  .miso-list__item-info-container {
    position: relative;
  }
  .miso-list__item-date {
    position: absolute;
    top: 0;
    right: 0;
  }
</style>
<section>
  <miso-ask>
    <miso-query></miso-query>
  </miso-ask>
</section>
<section>
  <miso-ask visible-when="ready">
    <div class="phrase">You asked about...</div>
    <miso-question></miso-question>
    <hr>
    <miso-answer></miso-answer>
    <miso-feedback></miso-feedback>
    <hr>
    <div class="phrase">My reply is based on the following:</div>
    <miso-sources></miso-sources>
    <div class="phrase" style="margin-top: 4rem;">Go beyond, and learn more about this topic:</div>
    <miso-related-resources></miso-related-resources>
  </miso-ask>
</section>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  MisoClient.plugins.use('std:ui');
  const client = new MisoClient({
    apiKey: '...',
    apiHost: 'http://localhost:9901/api',
  });
  const workflow = client.ui.ask;
  workflow.useApi('questions', {
    source_fl: ['cover_image', 'url', 'created_at', 'updated_at'],
  });
  workflow.useLayouts({
    sources: {
      templates: {
        product: renderSourceContent,
      },
    },
  });
});
function renderSourceContent(layout, state, data) {
  const { product_id, url, cover_image, title, created_at, snippet } = data;
  return `
<a class="miso-list__item-body" data-role="item" href="${url}" target="_blank" rel="noopener">
  <div class="miso-list__item-cover-image-container">
    <img class="miso-list__item-cover-image" src="${cover_image}">
  </div>
  <div class="miso-list__item-info-container">
    <div class="miso-list__item-title">${title}</div>
    <div class="miso-list__item-date">${new Date(created_at).toLocaleDateString()}</div>
    <div class="miso-list__item-snippet">${snippet}</div>
  </div>
</a>`;
}
</script>
{% endraw %}
