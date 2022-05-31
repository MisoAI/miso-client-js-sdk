---
---

{% raw %}
<div id="search-box" class="ais-SearchBox"></div>
<div id="hits" class="rows-4"></div>

<script>
const client = new MisoClient('...');

async function handleSearch({ misoApiName, mapRequest, callMisoApi, mapResponse }, request, options) {
  console.log('[Step 1]', misoApiName, request, options);
  const payload = mapRequest(misoApiName, request);
  console.log('[Step 2]', payload);
  const misoResponse = await callMisoApi(misoApiName, payload, options);
  console.log('[Step 3]', misoResponse);
  const response = mapResponse(misoApiName, request, misoResponse);
  console.log('[Step 4]', response);
  return response;
}

const search = instantsearch({
  searchClient: client.algolia.searchClient({
    handleSearch: handleSearch,
  }),
  indexName: '',
});

search.addWidgets([
  instantsearch.widgets.configure({
    hitsPerPage: 4,
  }),
  instantsearch.widgets.searchBox({
    container: '#search-box',
    autofocus: true,
    searchAsYouType: false,
    showSubmit: true,
  }),
  instantsearch.widgets.infiniteHits({
    container: '#hits',
    templates: {
      item: `
        <div class="product">
          <div class="title">{{ title }}</div>
          <div class="image">
            <img src="{{ cover_image }}">
          </div>
          <div class="footer">\${{ sale_price }}</div>
        </div>
      `,
    },
  }),
]);

search.start();
</script>
{% endraw %}
