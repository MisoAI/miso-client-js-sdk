import instantsearch from 'instantsearch.js';
import {
  configure,
  infiniteHits,
  refinementList,
  numericMenu
} from 'instantsearch.js/es/widgets';
import { connectSearchBox } from 'instantsearch.js/es/connectors';
import { autocomplete, getAlgoliaResults } from '@algolia/autocomplete-js';
import MisoClient from '@miso.ai/client-sdk';
import { AlgoliaPlugin } from '@miso.ai/client-sdk-algolia';
import apiKey from './key';

MisoClient.plugins.use(AlgoliaPlugin);

const client = new MisoClient(apiKey);
const indexName = '';

const search = instantsearch({
  searchClient: client.algolia.searchClient(),
  indexName: indexName
});

search.addWidgets([
  configure({
    hitsPerPage: 6
  }),
  refinementList({
    container: '#refinement-list-authors',
    attribute: 'authors',
    limit: 5,
    showMore: true
  }),
  refinementList({
    container: '#refinement-list-availability',
    attribute: 'availability'
  }),
  numericMenu({
    container: '#price-menu',
    attribute: 'sale_price',
    items: [
      { label: 'All' },
      { label: 'Less than $49.99', end: 49.99 },
      { label: 'Between $50 - $99.99', start: 50, end: 99.99 },
      { label: 'More than $100', start: 100 }
    ]
  }),
  connectSearchBox(() => {})({}),
  infiniteHits({
    container: '#hits',
    templates: {
      item: `
        <div class="product">
          <img class="image" src="{{ cover_image }}">
          <div class="main">
            <div class="title">{{ title }}</div>
            <div class="price">{{ sale_price }}</div>
          </div>
        </div>
      `
    }
  })
]);

search.start();

function setInstantSearchQueryState(query = '') {
  search.setUiState((uiState) => ({
    ...uiState,
    [indexName]: {
      ...uiState[indexName],
      page: 1,
      query: query,
      refinementList: undefined
    }
  }));
}

autocomplete({
  container: '#autocomplete',
  initialState: {
    query: ''
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
    return [
      {
        sourceId: 'miso',
        getItems: () =>
          getAlgoliaResults({
            searchClient: client.algolia.autocompleteClient(),
            queries: [
              {
                query: query,
                params: {
                  hitsPerPage: 5,
                  attributesToHighlight: ['suggested_queries']
                }
              }
            ]
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
                      attribute: 'suggested_queries'
                    })}
                  </div>
                </div>
              </div>
            </div>
          `
        }
      }
    ];
  }
});
