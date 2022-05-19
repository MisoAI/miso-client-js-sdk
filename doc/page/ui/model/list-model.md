---
layout: base.njk
title: MisoListModel
---
{% from 'macros.njk' import proptable %}

Most of the time a data model will be created automatically by an element. Nevertheless, you can also create a model manually:
```js
const MisoListModel = MisoClient.ui.models.classes.MisoListModel;
const model = new MisoListModel(options);
```

#### Options

The `options` parameter is an object with the following properties:

{{ proptable('ui:model', 'list-model.options') }}

{% include 'section/ui-model-api-types.md' %}

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
