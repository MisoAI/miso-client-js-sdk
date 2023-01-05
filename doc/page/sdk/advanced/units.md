---
title: Recommendation Unit
---

{% from 'macros.njk' import proptable %}

The SDK provides a controller to help you manage performance measurement events around your recommendation UI blocks.

### Basic Usage

Given a section containing a list of product items:

```html
<ul id="product-list">
  <li>
    <a href="...">Product A</a>
  </li>
  <li>
    <a href="...">Product B</a>
  </li>
  ...
</ul>
```

Annotate the elements with unit ID and your product IDs:

```html
<ul id="product-list" data-miso-unit-id="my-rec-unit">
  <li data-miso-product-id="product-a">
    <a href="...">Product A</a>
  </li>
  <li data-miso-product-id="product-b">
    <a href="...">Product B</a>
  </li>
  ...
</ul>
```

Then, turn on the plugin and bind the unit element with SDK:

```js
// turn on the units plugin
MisoClient.plugins.use('std:units');

// create client instance
const client = new MisoClient('...');

// bind the list element to a unit controller
const element = document.getElementById('product-list');
const unit = client.units.get(element);

// after product items are populated, turn on the tracker
unit.tracker.start();
```

The tracker will capture the following interaction event and send to Miso API automatically:
* `impression`
* `viewable_impression`
* `click`

### See also
* [Performance Measurement]({{ '/sdk/interactions/performance' | url }})
