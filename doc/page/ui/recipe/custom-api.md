---
layout: base.njk
title: Custom API
---

By specifying `api="custom"` you can override the data fetching behavior. In the following example, you can combine the results from two different Miso APIs:

```js
const model = new MisoClient.ui.models.classes.MisoListModel({
  api: 'custom',
  fetch: fetch
});

async function fetch({ payload, client }) {
  // call both API in bulk mode, so they are combined into a single request
  const [ response0, response1 ] = await Promise.all([
    client.api.recommendation.productToProducts({ product_id: '...', fl: ['*'], rows: 4 }, { bulk: true }),
    client.api.recommendation.userToProducts({ fl: ['*'], rows: 4 }, { bulk: true })
  ]);
  // combine the retrieved products starting with ones from productToProducts() with list size trimmed to 4
  const products = [...response0.products, ...response1.products].slice(0, 4);
  return {
    ...response0,
    products: products,
  };
}
```
