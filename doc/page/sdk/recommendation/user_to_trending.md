---
layout: base.njk
title: User to Trending
description: Returns the products that are currently trending and are most likely to be of interest to this user.
---
{% from 'macros.njk' import proptable %}

#### Syntax
```js
const response = await miso.api.recommendation.userToTrending(options);
```

#### Parameters
The `options` parameter is an object with the following properties:

{{ proptable('sdk', 'user_to_trending.options') }}

#### Return value
A `Promise` of response object with the following properties:

{{ proptable('sdk', 'user_to_trending.response') }}

#### Examples
```js
const options = {
  user_id: '...',
  user_hash: '...',
  fl: ['title', 'sale_price', 'custom_attributes.*']
};
const { products } = await miso.api.recommendation.userToTrending(options);
```

#### Learn more
For advanced usage, see [REST API](https://api.askmiso.com/#operation/trending_items_v1_recommendation_user_to_trending_post).
