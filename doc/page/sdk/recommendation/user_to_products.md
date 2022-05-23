---
title: User to Products
description: Returns the products that are most likely to drive conversion for the given user.
---
{% from 'macros.njk' import proptable %}

#### Syntax
```js
const response = await miso.api.recommendation.userToProducts(payload, options);
```

#### Payload
The `payload` parameter is an object with the following properties:

{{ proptable('sdk', 'user_to_products.payload') }}

{% include 'section/request-options.md' %}

#### Return value
A `Promise` of response object with the following properties:

{{ proptable('sdk', 'user_to_products.response') }}

#### Examples
```js
const payload = {
  user_id: '...',
  user_hash: '...',
  fl: ['title', 'sale_price', 'custom_attributes.*']
};
const { products } = await miso.api.recommendation.userToProducts(payload);
```

#### Learn more
For advanced usage, see [REST API](https://api.askmiso.com/#operation/user_to_products_v1_recommendation_user_to_products_post).
