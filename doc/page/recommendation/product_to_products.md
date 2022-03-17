---
layout: base.njk
title: Product to Products
description: Returns the products that are related to an anchor product (often the product the user is currently engaging with) and are also likely to drive conversions by connecting with the user’s interests. 
---
{% from 'macros.njk' import proptable %}

#### Syntax
```js
const response = await miso.api.recommendation.productToProducts(options);
```

#### Parameters
The `options` parameter is an object with the following properties:

{{ proptable('product_to_products.options') }}

#### Return value
A `Promise` of response object with the following properties:

{{ proptable('product_to_products.response') }}

#### Examples
```js
const options = {
  user_id: '...',
  user_hash: '...',
  product_id: '...',
  buy_together: true,
  fl: ['title', 'sale_price', 'custom_attributes.*']
};
const { products } = await miso.api.recommendation.productToProducts(options);
```

#### Learn more
For advanced usage, see [REST API](https://api.askmiso.com/#operation/product_to_products_v1_recommendation_product_to_products_post).
