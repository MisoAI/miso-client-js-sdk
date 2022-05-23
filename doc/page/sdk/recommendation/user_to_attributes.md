---
api: user_to_attributes
title: User to Attributes
description: Returns the product attributes that Miso expects to drive a conversion for the current user.
---

#### Syntax
```js
const response = await miso.api.recommendation.userToAttributes(payload, options);
```

{% include 'section/sdk-api.md' %}

#### Examples
```js
const payload = {
  user_id: '...',
  user_hash: '...',
  field: 'custom_attributes.author',
  products_per_attribute: 2,
  fl: ['title', 'sale_price', 'custom_attributes.*']
};
const { attributes } = await miso.api.recommendation.userToAttributes(payload);
```

#### Learn more
For advanced usage, see [REST API](https://api.askmiso.com/#operation/user_to_attributes_v1_recommendation_user_to_attributes_post).
