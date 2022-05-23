---
title: Installation
---

Install the npm modules:

```bash
npm install --save @miso.ai/client-sdk @miso.ai/client-sdk-algolia
```

In your app, import and setup the plugin:

```js
import MisoClient from '@miso.ai/client-sdk';
import { AlgoliaPlugin } from '@miso.ai/client-sdk-algolia';

MisoClient.plugins.use(AlgoliaPlugin);
```

### Usage

The plugin provides a compatible Algolia search client interface from Miso's SDK client.

```js
const client = new MisoClient('...');

const search = instantsearch({
  searchClient: client.algolia.searchClient(),
  indexName: '',
});
```
