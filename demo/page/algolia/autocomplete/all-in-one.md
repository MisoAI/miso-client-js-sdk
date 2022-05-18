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
    <hr>
    <h6>Sale Price</h6>
    <div id="price-menu"></div>
  </div>
  <div class="main">
    <div id="autocomplete"></div>
    <div id="hits" class="rows-3"></div>
  </div>
</div>

<script>
const client = new MisoClient('...');
const indexName = '';

const search = instantsearch({
  searchClient: client.algolia.searchClient(),
  indexName: indexName,
});

search.addWidgets([
  instantsearch.widgets.configure({
    hitsPerPage: 6,
  }),
  instantsearch.widgets.refinementList({
    container: '#refinement-list-authors',
    attribute: 'authors',
    limit: 5,
    showMore: true,
  }),
  instantsearch.widgets.refinementList({
    container: '#refinement-list-availability',
    attribute: 'availability',
  }),
  instantsearch.widgets.numericMenu({
    container: '#price-menu',
    attribute: 'sale_price',
    items: [
      { label: 'All' },
      { label: 'Less than $49.99', end: 49.99 },
      { label: 'Between $50 - $99.99', start: 50, end: 99.99 },
      { label: 'More than $100', start: 100 },
    ],
  }),
  instantsearch.connectors.connectSearchBox(() => {})({}),
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

function setInstantSearchQueryState(query = '') {
  search.setUiState(uiState => ({
    ...uiState,
    [indexName]: {
      ...uiState[indexName],
      page: 1,
      query: query,
      refinementList: undefined,
    },
  }));
}

autocomplete({
  container: '#autocomplete',
  initialState: {
    query: '',
  },
  onSubmit: ({ state }) => {
    const { query } = state;
    setInstantSearchQueryState(query);
  },
  onReset: () => {
    setInstantSearchQueryState();
  },
  autoFocus: true,
  getSources: ({ query }) => {
    // this is triggered on every user input
    return [{
      getItems: () => getAlgoliaResults({
        searchClient: client.algolia.autocompleteClient(),
        queries: [{
          query: query,
          params: {
            hitsPerPage: 5,
            attributesToHighlight: ['suggested_queries'],
          },
        }],
      }),
      onSelect: ({ setQuery, item }) => {
        const query = item._text;
        setQuery(query);
        setInstantSearchQueryState(query);
      },
      templates: {
        item: ({ item, components, html }) => html`
          <div class="aa-ItemWrapper">
            <div class="aa-ItemContent">
              <div class="aa-ItemContentBody">
                <div class="aa-ItemContentTitle">
                  ${components.Highlight({
                    hit: item,
                    attribute: 'suggested_queries',
                  })}
                </div>
              </div>
            </div>
          </div>
        `
      }
    }];
  },
});

</script>
{% endraw %}
