---
title: Miso UI quick start
---

We can setup the most basic list element with just few steps.

### Use the SDK bundled with UI plugin
```html
<script src="https://cdn.jsdelivr.net/npm/@miso.ai/client-sdk/dist/umd/miso-with-ui.min.js"></script>
```

See the [installation](./installation) section for other methods to setup.

### Add a custom element on the page
```html
<miso-list api="user_to_products" on:start="load">
  <script data-attr="payload" type="application/json">
    {
      "fl": ["*"]
    }
  </script>
  <template data-name="item">
    <div data-product-id="${data.product_id}">
      <a href="${data.url}">
        <h3>${data.title}</h3>
        <img src="${data.cover_image}">
        <h3>$${data.sale_price}</h3>
      </a>
    </div>
  </template>
</miso-list>
```
