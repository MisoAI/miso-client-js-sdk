---
title: Installation
---

### As NPM Module
To use SDK as an npm module, run in your project directory:

```bash
npm install --save @miso.ai/client-sdk @miso.ai/client-sdk-ui
```

In your application, register the UI plugin before creating an SDK client.

```js
const MisoClient = require('@miso.ai/client-sdk');
const { UiPlugin } = require('@miso.ai/client-sdk-ui');

MisoClient.plugins.use(UiPlugin);
```

### Using Script Tag
The SDK is also served by [jsDelivr](https://www.jsdelivr.com/package/npm/@miso.ai/client-sdk).

You can also include the SDK bundled with UI plugin in your webpage with script tag:

```html
<script src="https://cdn.jsdelivr.net/npm/@miso.ai/client-sdk/dist/umd/miso-with-ui.min.js"></script>
```

You don't need to register the plugin in this case, as the bundled version have done this for you.
