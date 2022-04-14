---
layout: base.njk
title: MisoListModel
---
{% from 'macros.njk' import proptable %}

Most of the time a data model will be created automatically by an element. Nevertheless, you can also create a model manually:
```js
const model = new MisoListModel(options);
```

The `options` parameter is an object with the following properties:

{{ proptable('ui:model', 'list-model.options') }}

Possible `api` values and their corresponding data items are:

<table class="table">
  <thead>
    <tr>
      <th scope="col">Value</th>
      <th scope="col">API Method</th>
      <th scope="col">Data Item Type</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>user_to_products</code></td>
      <td><a href="../../../sdk/recommendation/user_to_products">User To Products</a></td>
      <td>product</td>
    </tr>
    <tr>
      <td><code>user_to_attributes</code></td>
      <td><a href="../../../sdk/recommendation/user_to_attributes">User To Attributes</a></td>
      <td>attribute</td>
    </tr>
    <tr>
      <td><code>user_to_trending</code></td>
      <td><a href="../../../sdk/recommendation/user_to_trending">User To Trendings</a></td>
      <td>product</td>
    </tr>
    <tr>
      <td><code>product_to_products</code></td>
      <td><a href="../../../sdk/recommendation/product_to_products">Products To Products</a></td>
      <td>product</td>
    </tr>
    <tr>
      <td><code>search</code></td>
      <td><a href="../../../sdk/search/search">Search</a></td>
      <td>product</td>
    </tr>
    <tr>
      <td><code>autocomplete</code></td>
      <td><a href="../../../sdk/search/autocomplete">Autocomplete</a></td>
      <td>completion</td>
    </tr>
  </tbody>
</table>

#### Data
The current state of model data. The initial state of `items` is an empty array.
```js
const data = model.data;
/*
{
  items: [
    ...
  ]
}
*/
```



#### Action

##### load
Load model data asynchronously with the result of Miso API.
```js
model.load(payload);
```
The optional payload object will be merged into and override the default payload.

##### clear
Reset model data to initial state, an empty array.
```js
model.clear();
```



#### Data Event

##### refresh
The data event when the model replace its data entirely.
```js
model.on('refresh', ({ data }) => {
  // the new state of model data
  if (data.length) {
    for (const item of data) {
      // render each item
    }
  } else {
    // render empty state
  }
});
```
