---
layout: base.njk
title: User to Attributes
description: Returns the product attributes that Miso expects to drive a conversion for the current user.
---
{% from 'macros.njk' import proptable %}

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
