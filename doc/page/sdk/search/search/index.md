---
layout: base.njk
title: Search
description: Perform a personalized, typo-correcting, semantic search.
---
{% from 'macros.njk' import proptable %}

#### Syntax
```js
const response = await miso.api.search.search(options);
```

#### Parameters
The `options` parameter is an object with the following properties:

{{ proptable('sdk', 'search.options') }}

#### Return value
A `Promise` of response object with the following properties:

{{ proptable('sdk', 'search.response') }}

#### Examples
```js
const options = {
  user_id: '...',
  user_hash: '...',
  q: 'doge',
  fl: ['title', 'sale_price', 'custom_attributes.*']
};
const { products } = await miso.api.search.search(options);
```

#### Learn more
For advanced usage, see [REST API](https://api.askmiso.com/#operation/search_v1_search_search_post).
