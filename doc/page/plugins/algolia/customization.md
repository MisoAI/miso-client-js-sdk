---
title: Customization
---

### Custom search handler

You can fully control how Algolia's search request is processed by passing a handler function:

```js
const client = new MisoClient('...');
const searchClient = client.algolia.searchClient({
  handleSearch: async ({ misoApiName, mapRequest, callMisoApi, mapResponse }, request, options) => {
    // this is equivalent to the default behavior
    const payload = mapRequest(misoApiName, request);
    const misoResponse = await callMisoApi(misoApiName, payload, options);
    return mapResponse(misoApiName, request, misoResponse);
  }
});
```
