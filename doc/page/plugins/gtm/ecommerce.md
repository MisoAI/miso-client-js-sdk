---
title: Enhanced Ecommerce
---

This module captures [GTM Enhanced Ecommerce](https://developers.google.com/analytics/devguides/collection/ua/gtm/enhanced-ecommerce) events and turns them into Miso user interactions automatically.

### Basic Usage

For example, if you start ecommerce tracking with default settings:

```js
const client = new MisoClient('...');

client.gtm.ecommerce.start();
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

### Default mapping

<table id="event-mapping-table" class="table">
  <thead>
    <tr>
      <th scope="col">Ecommerce Event Key</th>
      <th scope="col">Miso Interaction Type</th>
      <th scope="col">Payload Properties</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>detail</code></td>
      <td><code>product_detail_page_view</code></td>
      <td>product IDs</td>
    </tr>
    <tr>
      <td><code>add</code></td>
      <td><code>add_to_cart</code></td>
      <td>product IDs, quantities</td>
    </tr>
    <tr>
      <td><code>remove</code></td>
      <td><code>remove_from_cart</code></td>
      <td>product IDs</td>
    </tr>
    <tr>
      <td><code>purchase</code></td>
      <td><code>checkout</code></td>
      <td>product IDs, quantities, revenue (if available)</td>
    </tr>
    <tr>
      <td>(anything else)</td>
      <td><code>custom</code></td>
      <td>custom action name (using event key)</td>
    </tr>
  </tbody>
</table>

### Select events to track

You can specify a set of events to track inclusively:

```js
client.gtm.ecommerce
  .accept('add', 'remove')
  .start();
```

Or exclusively:

```js
client.gtm.ecommerce
  .accept('*', '-checkout')
  .start();
```

### Custom event mapping

You can customize how events are mapped to Miso's interaction payloads:

```js
client.gtm.ecommerce
  .mapping((eventKey, eventData) => {
    if (eventKey === 'add') {
      // some custom handling...
      return [
        {
          type: 'add_to_cart',
          product_ids: [/* ...*/],
          quantities: [/* ...*/],
        }
      ];
    }
    // fallback to default mapping
    return client.gtm.ecommerce.helper.defaultMapping(eventKey, eventData);
  })
  .start();
```

### Stop tracking

Tracking can be stopped and resumed anytime:

```js
client.gtm.ecommerce.stop();

client.gtm.ecommerce.start();
```
