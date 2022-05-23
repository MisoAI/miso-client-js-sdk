---
api: user_to_trending
title: User to Trending
description: Returns the products that are currently trending and are most likely to be of interest to this user.
---

#### Syntax
```js
const response = await miso.api.recommendation.userToTrending(payload, options);
```

{% include 'section/sdk-api.md' %}

#### Examples
```js
const payload = {
  user_id: '...',
  user_hash: '...',
  fl: ['title', 'sale_price', 'custom_attributes.*']
};
const { products } = await miso.api.recommendation.userToTrending(payload);
```

#### Learn more
For advanced usage, see [REST API](https://api.askmiso.com/#operation/trending_items_v1_recommendation_user_to_trending_post).
