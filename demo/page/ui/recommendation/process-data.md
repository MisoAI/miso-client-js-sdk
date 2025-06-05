---
---

{% raw %}
<miso-recommendation>
  <miso-products></miso-products>
</miso-recommendation>
<script>
const misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(() => {
  MisoClient.plugins.use('std:ui');
  const client = new MisoClient('...');
  const workflow = client.ui.recommendations.get();
  workflow.useApi('user_to_products', { rows: 6 });
  function replaceProductUrl(url) {
    return url; // TODO
  }
  workflow.useDataProcessor(data => {
    if (!data.value) {
      return data; // updates from initial/loading state
    }
    return {
      ...data,
      value: {
        ...data.value,
        products: (data.value.products || []).map(product => ({
          ...product,
          url: replaceProductUrl(product.url),
        })),
      },
    };
  });
  workflow.start();
});
</script>
{% endraw %}
