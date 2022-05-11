---
---

<h3>User to products</h3>
<div id="results" class="product-list selectable"></div>

{% raw %}
<script>
const results = document.querySelector('#results');

const client = new MisoClient('...');

function renderUserToProducts(response) {
  results.innerHTML = response.products
    .map(renderProductCard)
    .join('');
}

client.api.recommendation.userToProducts({ fl: ['*'], rows: 4 })
  .then(renderUserToProducts);

</script>
{% endraw %}
