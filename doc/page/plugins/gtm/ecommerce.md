---
title: Enhanced Ecommerce
---

This module captures [GTM Enhanced Ecommerce](https://developers.google.com/analytics/devguides/collection/ua/gtm/enhanced-ecommerce) events and turns them into Miso user interactions automatically.

For example, with default settings:

```js
const client = new MisoClient('...');

client.gtm.ecommerce();
```

A push of such event to `dataLayer`:

```js
window.dataLayer.push({
  ecommerce: {
    add: {
      actionField: { /*...*/ },
      products: [
        {
          id: 'a001',
          quantity: 3
          //...
        },
        {
          id: 'a002',
          quantity: 4
          //...
        }
      ]
    }
  }
});
```

Will result in this interaction sent to Miso API:

```js
client.api.interactions.upload({
  type: 'add_to_cart',
  product_ids: ['a001', 'a002'],
  quantities: [3, 4]
});
```
