---
---

{% raw %}
<div id="search-control" class="input-group">
  <input id="input" type="text" class="form-control">
  <div id="suggested-queries" class="suggested-query-list"></div>
</div>

<script>
const input = document.querySelector('#input');
const submit = document.querySelector('#submit');
const suggestedQueries = document.querySelector('#suggested-queries');

const client = new MisoClient('...');

input.addEventListener('input', handleInput);

let autocompleteId = 0;

function handleInput() {
  const value = input.value.trim();
  const id = ++autocompleteId;
  if (!value) {
    clearSuggestedQueries();
  } else {
    client.api.search.autocomplete({ q: value, completion_fields: ['suggested_queries'] })
      .then(response => renderSuggestedQueries(response, id));
  }
}

function renderSuggestedQueries(response, id) {
  if (id !== autocompleteId) {
    return; // don't render if not at latest state
  }
  suggestedQueries.innerHTML = response.completions.suggested_queries
    .map(renderSuggestedQuery)
    .join('');
}

function renderSuggestedQuery(suggestedQuery) {
  return `
    <div class="suggested-query" data-text="${suggestedQuery.text}">
      ${suggestedQuery.text_with_inverted_markups}
    </div>
  `;
}

function clearSuggestedQueries() {
  suggestedQueries.innerHTML = '';
}

input.focus();
</script>
{% endraw %}
