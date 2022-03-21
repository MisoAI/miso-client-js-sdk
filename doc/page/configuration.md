---
layout: base.njk
title: Configuration
---

### Create Miso client
Create the client instance from npm module:
```js
const MisoClient = require('@miso.ai/client-sdk');
const apiKey = '...';
const miso = new MisoClient(apiKey);
```

If you include the SDK by script tag, create the client like this:
```js
var apiKey = '...';
var miso = new MisoClient(apiKey);
```

### Load asynchronously
If the SDK is loaded by an `async` script tag, it will be ready in the following callback:
```js
var apiKey = '...';
var misocmd = window.misocmd || (window.misocmd = []);
misocmd.push(function () {
  var miso = new MisoClient(apiKey);
});
```
