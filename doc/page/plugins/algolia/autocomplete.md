---
layout: base.njk
title: Working with Autocomplete
---

You can combine the power of Miso with InstantSearch.js and Autocomplete.

1. [Install]({{ '/plugins/algolia/installation' | url }}) Miso SDK and its Algolia plugin.
1. Install [Autocomplete](https://www.algolia.com/doc/ui-libraries/autocomplete/introduction/getting-started/).
1. Follow the [guide](https://www.algolia.com/doc/ui-libraries/autocomplete/integrations/with-instantsearch/) to integrate InstantSearch.js and Autocomplete.
1. Use the autocomplete client from Miso in place of Algolia's original search client.

### Example

```js
const client = new MisoClient('...');
const indexName = ''; // empty string for your default Miso engine

const search = instantsearch({
  // use Miso's search client
  searchClient: client.algolia.searchClient(),
  indexName: indexName
});

search.addWidgets([
  instantsearch.widgets.configure({
    hitsPerPage: 8
  }),
  // remove the original search box widget
  /*
  instantsearch.widgets.searchBox({
    container: '#search-box',
    autofocus: true,
    searchAsYouType: false,
    showSubmit: true,
  }),
  */
  // mount a virtual search box to manipulate InstantSearch's `query` UI state parameter
  instantsearch.connectors.connectSearchBox(() => {})({}),
  instantsearch.widgets.hits({
    container: '#hits',
    templates: { /* ... */ }
  })
]);

search.start();

function setInstantSearchQueryState(query = '') {
  // sync Autocomplete's query to InstantSearch's query state
  search.setUiState(uiState => ({
    ...uiState,
    [indexName]: {
      ...uiState[indexName],
      page: 1,
      query: query
    }
  }));
}

autocomplete({
  container: '#autocomplete',
  initialState: {
    query: ''
  },
  onSubmit: ({ state }) => {
    setInstantSearchQueryState(state.query);
  },
  onReset: () => {
    setInstantSearchQueryState();
  },
  /*
  // for a submit-based search paradigm, comment out this part
  onStateChange: ({ prevState, state }) => {
    const { query: prevQuery } = prevState;
    const { query } = state;
    if (prevQuery !== query) {
      setInstantSearchQueryState(query);
    }
  },
  */
  autoFocus: true,
  getSources: ({ query }) => {
    // this is triggered on every user input
    return [{
      getItems: () => getAlgoliaResults({
        // use Miso's autocomplete client
        searchClient: client.algolia.autocompleteClient(),
        queries: [{
          query: query,
          params: {
            hitsPerPage: 5,
            attributesToHighlight: ['suggested_queries'],
          }
        }]
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
  }
});
```
