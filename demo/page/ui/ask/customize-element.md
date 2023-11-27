---
---

{% raw %}
<h1 class="hero-title">Miso Answers</h1>
<div id="miso-ask-combo" class="miso-ask-combo"></div>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(async () => {
  const client = new MisoClient({
    apiKey: '...',
    apiHost: 'http://localhost:9901/api',
  });
  client.ui.asks.useLayouts({
    sources: {
      templates: {
        article: renderSourceContent,
      },
    },
  });
  await client.ui.ready;
  const { templates } = MisoClient.ui.defaults.ask;
  const rootElement = document.querySelector('#miso-ask-combo');
  rootElement.innerHTML = templates.root();
});
function renderSourceContent(layout, state, data) {
  const { url, cover_image, title, created_at, snippet } = data;
  return `
<a class="miso-list__item-body" data-role="item" href="${url}" target="_blank" rel="noopener">
  <div class="miso-list__item-cover-image-container">
    <img class="miso-list__item-cover-image" src="${cover_image}">
  </div>
  <div class="miso-list__item-info-container">
    <div class="miso-list__item-title">[Customized!] ${title}</div>
    <div class="miso-list__item-date">${new Date(created_at).toLocaleDateString()}</div>
    <div class="miso-list__item-snippet">${snippet}</div>
  </div>
</a>`;
}
</script>
{% endraw %}
