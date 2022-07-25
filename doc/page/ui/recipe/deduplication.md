---
title: Deduplication
---

{%- from 'macros.njk' import code_example_link with context -%}

If you want to deduplicate the results across have multiple recommendation sections in one page, you can achieve it using model’s transform setting.

{{ code_example_link('ui/deduplication') }}

Given 2 `<miso-list>` in the page, each of which shows 4 products:
```html
<miso-list id="x" class="recommendation" auto-model="false" on:start="load">...</miso-list>
<miso-list id="y" class="recommendation" auto-model="false" on:start="load">...</miso-list>
```

Keep track of shown items and filter out redundant ones:

```js
const shownProductIds = new Set();

function transform(data) {
  // filter out already shown products and trim size to 4
  const items = data.items
    .filter(item => !shownProductIds.has(item.product_group_id))
    .slice(0, 4);
  // keep track of which products are shown
  for (const item of items) {
    shownProductIds.add(item.product_id);
  }
  return Object.assign({}, data, { items: items });
}

const MisoListModel = MisoClient.ui.models.classes.MisoListModel;
const misoListX = document.querySelector('#x');
const misoListY = document.querySelector('#x');

misoListX.model = new MisoListModel({
  api: 'user_to_products',
  payload: {
    // ...,
    rows: 8 // in the worst case, 4 of them are filtered out
  },
  transform: transform
});
misoListY.model = new MisoListModel({
  api: 'product_to_products',
  payload: {
    // ...,
    rows: 8
  },
  transform: transform
});
```
