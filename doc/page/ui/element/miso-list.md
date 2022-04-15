---
layout: base.njk
title: <miso-list>
---

A basic element to render a list of items.

#### Attribute

##### api
The Miso API to retrieve data.
* This attribute is mandatory to create model automatically. If you want to create data model manually, leave out this attribute.
```html
<miso-list api="user_to_products">...</miso-list>
```

See [List Model](../model/list-model) for accepted values.

##### payload (optional)
The default payload when calling Miso API.
```html
<miso-list>
  ...
  <script data-attr="payload" type="application/json">
    {
      "fl": ["*"]
    }
  </script>
  ...
</miso-list>
```

#### Template slot

##### item
A mandatory template to render each item of the data array.
```html
<miso-list>
  ...
  <template data-name="item">
    <li>${data.title}: $${data.sale_price}</li>
  </template>
  ...
</miso-list>
```

##### container (optional)
An optional template for the container element holding the items. 
* The default value is `<div></div>`. 
* This element will only be created one time, initially.

```html
<miso-list>
  ...
  <template data-name="container">
    <ul></ul>
  </template>
  ...
</miso-list>
```

As an example, combining the two templates above renders the data like this:
```html
<ul>
  <li>Plush Dog Toy: $17.99</li>
  <li>Chew Toy: $10.99</li>
  <li>Flying Disc: $13.99</li>
</ul>
```

#### Trigger

##### start
Trigger the specified action as soon as the element and model are ready.
```html
<miso-list on:start="load">
  ...
</miso-list>
```

In the example above, the element will invoke model's `load()` method as soon as possible, so the result will populate soon after page loads.

#### Custom event

##### refresh
The element dispatches `refresh` custom event when it's rerendered.
```js
const element = document.querySelector('miso-list');
element.addEventListener('refresh', (event) => {
  // do some side effect when the element is refreshed.
});
```
