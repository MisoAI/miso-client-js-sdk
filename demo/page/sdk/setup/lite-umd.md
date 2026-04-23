---
dependency: none
---

{% raw %}
<h3>User to products</h3>
<div id="results" class="product-list selectable"></div>
<script async src="https://cdn.jsdelivr.net/npm/@miso.ai/client-sdk@latest/dist/umd/miso-lite.min.js"></script>
<script>
function renderProductCard(product) {
  return `
  <a class="product-card row-4" href="${ product.url }">
    <div>
      <div class="title">${ product.title }</div>
      <div class="image"><img src="${ product.cover_image }"></div>
      <div class="footer">$${ product.sale_price }</div>
    </div>
  </a>
`;
}
(window.misocmd || (window.misocmd = [])).push(async () => {
  await MisoClient.plugins.install('std:lorem');
  const client = new MisoClient('...');
  const { products } = await client.api.recommendation.userToProducts({ fl: ['*'], rows: 4 });
  document.querySelector('#results').innerHTML = products.map(renderProductCard).join('');
});
</script>
{% endraw %}
