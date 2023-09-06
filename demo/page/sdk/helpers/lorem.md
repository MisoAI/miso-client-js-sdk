---
---

{% raw %}
<h3>User to products</h3>
<div id="results" class="product-list selectable"></div>
<script>
(window.misocmd || (window.misocmd = [])).push(async () => {
  window.MisoClient.plugins.use('std:lorem');
  const client = new MisoClient('...');
  const { products } = await client.api.recommendation.userToProducts({ fl: ['*'], rows: 4 });
  document.querySelector('#results').innerHTML = products.map(renderProductCard).join('');
});
</script>
{% endraw %}
