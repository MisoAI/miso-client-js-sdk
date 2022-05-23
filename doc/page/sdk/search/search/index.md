---
api: search
title: Search
description: Perform a personalized, typo-correcting, semantic search.
---

#### Syntax
```js
const response = await miso.api.search.search(payload, options);
```

{% include 'section/sdk-api.md' %}

#### Examples
```js
const payload = {
  user_id: '...',
  user_hash: '...',
  q: 'doge',
  fl: ['title', 'sale_price', 'custom_attributes.*']
};
const { products } = await miso.api.search.search(payload);
```

#### Learn more
For advanced usage, see [REST API](https://api.askmiso.com/#operation/search_v1_search_search_post).
