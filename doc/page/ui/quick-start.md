---
layout: base.njk
title: Miso UI quick start
---

We can setup the most basic list element with just few steps.

### Turn on UI plugin
```js
MisoClient.plugins.install('std:ui');
```

### Add the custom element on the page
```html
<miso-list api="user_to_products" on:start="load">
  <script data-attr="payload" type="application/json">
    {
      "fl": ["*"]
    }
  </script>
  <script data-attr="template" data-name="item" type="template/string">
    <div data-product-id="${data.product_id}">
      <a href="${data.url}">
        <h3>${data.title}</h3>
        <img src="${data.cover_image}">
        <h3>$${data.sale_price}</h3>
      </a>
    </div>
  </script>
</miso-list>
```
