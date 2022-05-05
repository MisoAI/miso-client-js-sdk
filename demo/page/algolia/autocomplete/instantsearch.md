---
---

{% raw %}
<div id="autocomplete"></div>
<!--
<div id="search-box" class="ais-SearchBox"></div>
-->
<div id="hits" class="rows-4"></div>

<script>
const client = new MisoClient();
const indexName = '';

const search = instantsearch({
  searchClient: client.algoliaClient(),
  indexName: indexName,
});

search.addWidgets([
  instantsearch.widgets.configure({
    hitsPerPage: 4,
  }),
  // Mount a virtual search box to manipulate InstantSearch's `query` UI state parameter
  instantsearch.connectors.connectSearchBox(() => {})({}),
  /*
  instantsearch.widgets.searchBox({
    container: '#search-box',
    autofocus: true,
    searchAsYouType: false,
    showSubmit: true,
  }),
  */
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
  getSources: ({ query }) => {
    // this is triggered on every user input
    return [{
      getItems: () => getAlgoliaResults({
        searchClient: client.algoliaClient({ autocomplete: true }),
        queries: [{
          query: query,
          params: {
            hitsPerPage: 5,
            attributesToHighlight: ['title'],
          },
        }],
      }),
      templates: {
        item: ({ item, components, html }) => html`
          <div class="aa-ItemWrapper">
            <div class="aa-ItemContent">
              <div class="aa-ItemContentBody">
                <div class="aa-ItemContentTitle">
                  ${components.Highlight({
                    hit: item,
                    attribute: 'title',
                  })}
                </div>
              </div>
            </div>
          </div>
        `
      }
    }];
  },
  /*
  onStateChange: ({ prevState, state }) => {
    const { query: prevQuery } = prevState;
    const { query } = state;
    if (prevQuery !== query) {
      setInstantSearchQueryState(query);
    }
  },
  */
});

</script>
{% endraw %}
