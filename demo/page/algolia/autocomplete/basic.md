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

autocomplete({
  container: '#autocomplete',
  initialState: {
    query: '',
  },
  onSubmit: ({ state }) => {
    setInstantSearchQueryState(state.query);
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
        setQuery(item._text);
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
