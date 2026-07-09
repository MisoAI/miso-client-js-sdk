# @miso.ai/client-sdk-workflow

The workflow layer of the Miso JavaScript client SDK, hosted by the
`std:workflow` plugin: workflow classes (Ask, Search, HybridSearch,
Recommendation, Explore), actors, and the default-options store. It has no DOM
dependency at import time, so it can be loaded and tested in Node. The
presentation layer (custom elements, layouts) lives in
`@miso.ai/client-sdk-ui`.

## Client interface

The plugin injects `client.workflows` on each `MisoClient` instance, the
canonical access point for workflow singletons and contexts:

```javascript
const client = new MisoClient(apiKey);

client.workflows.search;         // Search workflow (lazy singleton)
client.workflows.hybridSearch;   // HybridSearch workflow (lazy singleton)
client.workflows.asks;           // Asks context (follow-up chain)
client.workflows.ask;            // === client.workflows.asks.root
client.workflows.explores.get(unitId);
client.workflows.explore;        // default explore unit
client.workflows.recommendations.get(unitId);
client.workflows.recommendation; // default recommendation unit
client.workflows.sources.api;    // the data source function DataActor uses
```

The `client.ui.*` counterparts in the UI plugin delegate here for backward
compatibility.

## Default workflow options

The plugin owns a store of default options keyed by workflow name
(`ask`, `search`, `hybrid-search`, `recommendation`, `explore`).

- The plugin itself seeds the non-layout options: `api`, `trackers`,
  `pagination`, `autocomplete`, `filters` (see `src/default-options.js`).
- The UI plugin seeds the default layout options (and UI templates).
- Workflows read their defaults from the store at creation; values set here
  are overridden by context-level and workflow-level options (e.g.
  `useLayouts()`).

To customize defaults, set them before the workflow instance is created:

```javascript
const plugin = await MisoClient.plugins.whenInstalled('std:workflow');

plugin.defaults.set('search', {
  api: { payload: { fl: ['title', 'url'] } },
  layouts: { products: ['list', { itemType: 'article' }] },
});
```

`set(name, options)` merges shallowly per feature key (`api`, `layouts`, ...).

## The `workflows` extension point

When installed, the plugin adds a `workflows` extension point to the plugin
context, through which other plugins access the same store:

```javascript
export default class MyPlugin {
  static get id() { return 'std:my-plugin'; }

  install(MisoClient, { workflows }) {
    workflows.defaults.set('search', { layouts: { ... } });
  }
}
```

Workflows themselves receive the plugin through their constructor and read
defaults from `plugin.defaults`.
