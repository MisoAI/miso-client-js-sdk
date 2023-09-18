---
dependency: detached
---

{% raw %}
<h3>User to products</h3>
<div id="results" class="product-list selectable"></div>
<screen name="detached"></screen>

<script>
(window._misocmd || (window._misocmd = [])).push(async (MisoClient) => {
  MisoClient.plugins.use('std:lorem');
  const client = new MisoClient('...');
  const { products } = await client.api.recommendation.userToProducts({ fl: ['*'], rows: 4 });
  document.querySelector('#results').innerHTML = products.map(renderProductCard).join('');

  show(
    'detached',
    () => `window.MisoClient = ${window.MisoClient}`,
    { raw: true },
  );
});

</script>
{% endraw %}
