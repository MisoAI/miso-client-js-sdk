---
title: Installation
---

Install the npm modules:

```bash
npm install --save @miso.ai/client-sdk @miso.ai/client-sdk-gtm
```

In your app, import and setup the plugin:

```js
import MisoClient from '@miso.ai/client-sdk';
import { GtmPlugin } from '@miso.ai/client-sdk-gtm';

MisoClient.plugins.use(GtmPlugin);
```

### Basic Usage

The plugin captures Enhanced Ecommerce events from `dataLayer` and sends corresponding user interactions to Miso API.

```js
const client = new MisoClient('...');

client.gtm.ecommerce();
```
