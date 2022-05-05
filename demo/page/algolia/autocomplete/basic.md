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
});

</script>
{% endraw %}
