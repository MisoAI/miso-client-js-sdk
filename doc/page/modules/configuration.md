---
layout: base.njk
title: Configuration
---
### Create Miso client
Create the client instance from npm module:
```js
const createMiso = require('@miso.ai/client-sdk');
const miso = createMiso(`${api_key}`);
```

If you include the SDK by script tag, create the client like this:
```js
var miso = window.miso(`${api_key}`);
```

### Load asynchronously
If the SDK is loaded by an `async` script tag, it will be ready in the following callback:
```js
var misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(function () {
  var miso = window.miso(`${api_key}`);
});
```
