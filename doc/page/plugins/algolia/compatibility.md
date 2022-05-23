---
layout: base.njk
title: Compatibility
---
{% from 'macros.njk' import comparison_table %}

The page elaborates the compatibility between Algolia's API and Miso's implementation.

#### Index Name
In InstantSearch.js and Autocomplete, you have to pass a mandatory parameter for index name to their init functions. We use this parameter to correspond to Miso's engine ID:

```js
const client = new MisoClient('...');
const engineId = '...'; // empty string for default Miso engine

const search = instantsearch({
  //searchClient: searchClient,
  searchClient: client.algolia.searchClient(),
  indexName: engineId
});
```

## Search parameters
{{ comparison_table('algolia', 'basic') }}

#### Pagination
Both kinds of Algolia's pagination paradigm are supported.

{{ comparison_table('algolia', 'pagination') }}

For example, the following parameters:
```js
searchClient.search([{ hitsPerPage: 10, page: 5 /* ... */ }]);
```

are mapped to Miso's parameters like this:
```js
client.api.search.search({ rows: 10, start: 10 * 5 /* ... */ });
```

#### Filters
Algolia's filter expressions are translated to Miso's syntax.

{{ comparison_table('algolia', 'filter') }}

#### Facets
{{ comparison_table('algolia', 'facet') }}

#### Highlighting
{{ comparison_table('algolia', 'highlighting') }}
