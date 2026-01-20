# Plugin System

This directory contains the core plugin infrastructure and standard plugins for the Miso Client SDK.

## Architecture

### PluginRoot (`plugin-root.js`)

The central registry that manages plugin lifecycle:

- **Registration**: `register(PluginClass)` - Makes a plugin available by its ID
- **Activation**: `use(id, options)` - Instantiates and installs a registered plugin
- **Installation**: `install(id, options)` - Combines register + use, supports remote loading for `std:*` plugins

### PluginContext

Exposed to plugins during `install()`, provides hooks into the SDK:

```javascript
context.addPayloadPass(fn)    // Modify API request payloads
context.addHeadersPass(fn)    // Modify request headers
context.addUrlPass(fn)        // Modify request URLs
context.setCustomFetch(fn)    // Override fetch implementation
context.setCustomSendBeacon(fn) // Override sendBeacon
context.addSubtree(component) // Register as component subtree for event propagation
context.onHubUpdate(fn)       // Listen to hub state updates
context.onHubEmit(fn)         // Listen to hub emissions
context.whenInstalled(id)     // Wait for another plugin
context.classes               // Access to SDK classes
```

## Creating a Plugin

### Basic Structure

```javascript
const PLUGIN_ID = 'std:my-plugin';

export default class MyPlugin {
  static get id() {
    return PLUGIN_ID;
  }

  // Optional: extend Component for event support
  // constructor() { super('my-plugin'); }

  install(MisoClient, context) {
    // Setup logic here
    MisoClient.on('create', this._injectClient.bind(this));
  }

  // Optional: allow runtime configuration
  config(options) {
    this._options = options;
  }

  _injectClient(client) {
    // Extend client instances
    client.myFeature = new MyFeature(this, client);
  }
}
```

### Plugin Patterns

1. **Payload Modifier** (e.g., `context.js`, `interactions.js`): Intercept and modify API payloads
2. **Client Injector**: Add properties/methods to each MisoClient instance
3. **Component-based** (extend `Component`): For plugins needing event emission and subtree registration

## Standard Plugins

| Plugin | ID | Purpose |
|--------|-----|---------|
| `ContextPlugin` | `std:context` | User identity (anonymous_id, user_id, site) |
| `PageInfoPlugin` | `std:page-info` | Adds page metadata to requests |
| `AutoEventsPlugin` | `std:auto-events` | Automatic interaction tracking |
| `InteractionsPlugin` | `std:interactions` | Enriches interaction records with SDK version/UUID |
| `NativeFetchPlugin` | `std:native-fetch` | Uses native fetch, bypassing custom implementations |
| `ApiPatchPlugin` | `std:api-patch` | Applies patches to API responses |
| `HeaderApiKeyPlugin` | `std:header-api-key` | Sends API key in header instead of query |
| `AnalyticsPlugin` | `std:analytics` | User engagement timing and analytics |

## Pass Functions

Pass functions receive a context object and return modified values:

```javascript
// Payload pass signature
function modifyPayload({ client, apiGroup, apiName, payload }) {
  // apiGroup: 'search', 'ask', 'interactions', etc.
  // apiName: 'search', 'upload', 'questions', etc.
  return modifiedPayload;
}

// Headers pass signature
function modifyHeaders({ client, headers }) {
  return { ...headers, 'X-Custom': 'value' };
}
```

## Lifecycle

1. `register()` - Plugin class stored by ID
2. `use()` - Plugin instantiated, `config()` called if options provided
3. `install()` - Plugin's `install(MisoClient, context)` called
4. `MisoClient.on('create')` - Hook to extend new client instances
