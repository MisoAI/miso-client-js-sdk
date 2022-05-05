---
---

{% raw %}
<div id="search-box" class="ais-SearchBox"></div>
<div id="hits" class="rows-4"></div>

<script>
const client = new MisoClient();

const search = instantsearch({
  searchClient: client.algoliaClient(),
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
  instantsearch.connectors.connectAutocomplete((renderOptions, isFirstRender) => {
    console.log(renderOptions, isFirstRender);
  })({}),
  instantsearch.widgets.infiniteHits({
    container: '#hits',
    templates: {
      item: `
        <div>
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
