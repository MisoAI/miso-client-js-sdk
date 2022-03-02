---
layout: base.njk
title: Recommendation
---
{% from 'macros.njk' import proptable %}

### User to Products
Returns the products that are most likely to drive conversion for the given user.

#### Syntax
```js
const response = await miso.api.recommendation.user_to_products(options);
```

#### Parameters
The `options` parameter is an object with the following properties:

{{ proptable('user_to_products.options') }}

#### Return value
A `Promise` of response object with the following properties:

{{ proptable('user_to_products.response') }}

#### Examples
```js
const options = {
  user_id: '...',
  user_hash: '...',
  fl: ['title', 'sale_price', 'custom_attributes.*']
};
const { products } = await miso.api.recommendation.user_to_products(options);
```

#### Learn more
For advanced usage, see [REST API](https://api.askmiso.com/#operation/user_to_products_v1_recommendation_user_to_products_post).



### User to Attributes
Returns the product attributes that Miso expects to drive a conversion for the current user.

#### Syntax
```js
const response = await miso.api.recommendation.user_to_attributes(options);
```

#### Parameters
The `options` parameter is an object with the following properties:

{{ proptable('user_to_attributes.options') }}

#### Return value
A `Promise` of response object with the following properties:

{{ proptable('user_to_attributes.response') }}

#### Examples
```js
const options = {
  user_id: '...',
  user_hash: '...',
  field: 'custom_attributes.author',
  products_per_attribute: 2,
  fl: ['title', 'sale_price', 'custom_attributes.*']
};
const { attributes } = await miso.api.recommendation.user_to_attributes(options);
```

#### Learn more
For advanced usage, see [REST API](https://api.askmiso.com/#operation/user_to_attributes_v1_recommendation_user_to_attributes_post).



### User to Trending
Returns the products that are currently trending and are most likely to be of interest to this user.

#### Syntax
```js
const response = await miso.api.recommendation.user_to_trending(options);
```

#### Parameters
The `options` parameter is an object with the following properties:

{{ proptable('user_to_trending.options') }}

#### Return value
A `Promise` of response object with the following properties:

{{ proptable('user_to_trending.response') }}

#### Examples
```js
const options = {
  user_id: '...',
  user_hash: '...',
  fl: ['title', 'sale_price', 'custom_attributes.*']
};
const { products } = await miso.api.recommendation.user_to_trending(options);
```

#### Learn more
For advanced usage, see [REST API](https://api.askmiso.com/#operation/trending_items_v1_recommendation_user_to_trending_post).



### Product to Products
Returns the products that are related to an anchor product (often the product the user is currently engaging with) and are also likely to drive conversions by connecting with the user’s interests. 

#### Syntax
```js
const response = await miso.api.recommendation.product_to_products(options);
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
const { products } = await miso.api.recommendation.product_to_products(options);
```

#### Learn more
For advanced usage, see [REST API](https://api.askmiso.com/#operation/product_to_products_v1_recommendation_product_to_products_post).
