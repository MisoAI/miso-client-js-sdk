---
layout: base.njk
title: Search
---
{% from 'macros.njk' import proptable %}

### Search
Perform a personalized, typo-correcting, semantic search.

#### Syntax
```js
const response = await miso.api.search.search(options);
```

#### Parameters
The `options` parameter is an object with following properties:

{{ proptable('search.options') }}

#### Return value

#### Examples
```js
const options = {
  q: 'doge'
};
const { products } = await miso.api.search.search(options);
```

#### Learn more
For advanced usage, see [REST API](https://api.askmiso.com/#operation/search_v1_search_search_post).

### Autocomplete
Provides real-time, personalized, typo resistant typeahead for your search bar.

#### Syntax
```js
const response = await miso.api.search.autocomplete(options);
```

#### Parameters
The `options` parameter is an object with following properties:

{{ proptable('autocomplete.options') }}

#### Return value

#### Examples
```js
const options = {
  q: 'shiba '
};
const { completions } = await miso.api.search.autocomplete(options);
```

#### Learn more
For advanced usage, see [REST API](https://api.askmiso.com/#operation/autocomplete_v1_search_autocomplete_post).