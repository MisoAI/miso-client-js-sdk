---
---

<div id="results" class="product-list selectable"></div>

{% raw %}
<script>
const results = document.querySelector('#results');

const client = new MisoClient('...');

function renderUserToHistory(response) {
  results.innerHTML = response.products
    .map(renderProductCard)
    .join('');
}

client.api.recommendation.userToHistory({ history_type: 'last_checkout', fl: ['*'], rows: 4 })
  .then(renderUserToHistory);

</script>
{% endraw %}
