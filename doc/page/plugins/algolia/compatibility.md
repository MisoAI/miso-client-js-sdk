---
layout: base.njk
title: Compatibility
---

### Index Name
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

### Algolia's search parameters
