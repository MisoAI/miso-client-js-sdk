---
layout: base.njk
title: Working with InstantSearch.js
---

With InstantSearch.js properly setup, you can connect it to Miso SDK easily:

1. [Install]({{ '/plugins/algolia/installation' | url }}) Miso SDK and its Algolia plugin.
1. Substitute algolia's search client with the one generated from Miso SDK client.

Miso's philosophy promotes a submit-based search paradigm, accomplished with an [autocomplete]({{ '/plugins/algolia/autocomplete' | url }}) UI pattern.

### Example

```js
//const searchClient = algoliasearch(...);
const client = new MisoClient('...');

const search = instantsearch({
  //searchClient: searchClient,
  searchClient: client.algolia.searchClient(),
  indexName: '' // empty string for default Miso engine
});

search.addWidgets([
  instantsearch.widgets.configure({
    hitsPerPage: 8
  }),
  instantsearch.widgets.searchBox({
    container: '#search-box',
    autofocus: true,
    searchAsYouType: false,
    showSubmit: true
  }),
  instantsearch.widgets.hits({
    container: '#hits',
    templates: { /* ... */ }
  })
]);

search.start();
```
