---
---

{% raw %}
<div id="searchbox" class="ais-SearchBox"></div>
<div id="hits"></div>

<script>
const search = instantsearch({
  searchClient: client.algoliaClient,
  indexName: ''
});

search.addWidgets([
  instantsearch.widgets.searchBox({
    container: '#searchbox',
  }),
  instantsearch.widgets.hits({
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
