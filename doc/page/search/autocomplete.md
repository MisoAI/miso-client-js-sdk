---
layout: base.njk
title: Autocomplete
description: Provides real-time, personalized, typo resistant typeahead for your search bar.
---
{% from 'macros.njk' import proptable %}

#### Syntax
```js
const response = await miso.api.search.autocomplete(options);
```

#### Parameters
The `options` parameter is an object with following properties:

{{ proptable('autocomplete.options') }}

#### Return value

A `Promise` of response object with the following properties:

{{ proptable('autocomplete.response') }}

#### Examples
```js
const options = {
  user_id: '...',
  user_hash: '...',
  q: 'shiba ',
  fl: ['title', 'sale_price'],
  completion_fields: ['title', 'tags', 'custom_attributes.author']
};
const { completions } = await miso.api.search.autocomplete(options);
for (const { text, text_with_markups, product } of completions.title) {
  // ...
}
```

#### Learn more
For advanced usage, see [REST API](https://api.askmiso.com/#operation/autocomplete_v1_search_autocomplete_post).