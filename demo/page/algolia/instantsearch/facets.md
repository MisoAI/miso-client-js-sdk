---
---

{% raw %}
<div class="body">
  <div class="aside">
    <h3>Refinement</h3>
    <hr>
    <h6>Author</h6>
    <div id="refinement-list-authors"></div>
    <hr>
    <h6>Availability</h6>
    <div id="refinement-list-availability"></div>
  </div>
  <div class="main">
    <div id="search-box" class="ais-SearchBox"></div>
    <div id="hits" class="rows-3"></div>
  </div>
</div>

<script>
const client = new MisoClient('...');

const search = instantsearch({
  searchClient: client.algolia.searchClient(),
  indexName: '',
});

search.addWidgets([
  instantsearch.widgets.configure({
    hitsPerPage: 6,
  }),
  instantsearch.widgets.refinementList({
    container: '#refinement-list-authors',
    attribute: 'authors',
  }),
  instantsearch.widgets.refinementList({
    container: '#refinement-list-availability',
    attribute: 'availability',
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
