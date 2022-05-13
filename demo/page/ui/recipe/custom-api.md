---
---

{% raw %}
<miso-list auto-model="false" on:start="load">
  <template data-name="container" data-type="string">
    <div class="product-list"></div>
  </template>
  <template data-name="item" data-type="string">
    <div class="product-card row-4">
      <div>
        <div class="title">${ data.title }</div>
        <div class="image">
          <img src="${ data.cover_image }">
        </div>
        <div class="footer">$${ data.sale_price }</div>
      </div>
    </div>
  </template>
</miso-list>

<script>
const client = new MisoClient('...');

const element = document.querySelector('miso-list');

function createModel() {
  return new MisoClient.ui.models.classes.MisoListModel({
    api: 'custom',
    fetch: async ({ payload, client }) => {
      const [ searchResponse, recommendationResponse ] = await Promise.all([
        client.api.search.search({ q: 'shiba', fl: ['*'], rows: 4 }, { bulk: true }),
        client.api.recommendation.userToProducts({ fl: ['*'], rows: 4 }, { bulk: true }),
      ]);
      return {
        ...recommendationResponse,
        products: [
          ...searchResponse.products,
          ...recommendationResponse.products,
        ],
      };
    }
  });
}

(async () => {
  await customElements.whenDefined('miso-list');
  element.model = createModel();
})();
</script>
{% endraw %}
