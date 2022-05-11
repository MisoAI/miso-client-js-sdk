---
---

{% raw %}
<div id="search-control" class="input-group">
  <input id="input" type="text" class="form-control">
  <button id="submit" class="btn btn-outline-secondary" type="button">Search</button>
</div>
<div id="results" class="product-list"></div>
<script>
document.querySelector('#input').focus();
</script>
{% endraw %}

{% raw %}
<script>
const input = document.querySelector('#input');
const submit = document.querySelector('#submit');
const results = document.querySelector('#results');

const client = new MisoClient('...');

input.addEventListener('keyup', (event) => (event.key === 'Enter') && handleSubmit(event));
submit.addEventListener('click', handleSubmit);

function handleSubmit() {
  if (event.defaultPrevented) {
    return;
  }
  const value = input.value.trim();
  client.api.search.search({ q: value, fl: ['*'], rows: 8 })
    .then(renderSearchResults);
}

function renderSearchResults(response) {
  results.innerHTML = response.products
    .map(renderProductCard)
    .join('');
}

</script>
{% endraw %}
