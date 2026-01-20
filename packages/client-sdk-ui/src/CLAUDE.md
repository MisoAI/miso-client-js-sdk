# Client SDK UI

The UI package (`std:ui` plugin) provides the presentation layer for Miso SDK, including custom elements, workflows, and rendering infrastructure.

## Architecture Overview

// TODO: wrong concept

```
┌─────────────────────────────────────────────────────────────────┐
│                         UiPlugin                                │
│  - Registered as 'std:ui'                                       │
│  - Injects client.ui on each MisoClient instance                │
│  - Manages layouts, combo, and extensions                       │
└─────────────────────────────────────────────────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │  Workflows  │      │  Elements   │      │   Layouts   │
   │             │◄────►│             │◄────►│             │
   │  (Logic)    │      │ (Custom El) │      │ (Rendering) │
   └─────────────┘      └─────────────┘      └─────────────┘
          │
          ▼
   ┌─────────────┐
   │   Actors    │
   │  (Hub I/O)  │
   └─────────────┘
```

## Core Directories

// TODO: wrong concept

| Directory | Purpose |
|-----------|---------|
| `workflow/` | Orchestration logic for features (Ask, Search, Explore, etc.) |
| `element/` | Custom HTML elements (`<miso-*>` tags) |
| `actor/` | Hub-connected actors for data, views, tracking, interactions |
| `layout/` | Rendering templates for different UI roles |
| `combo/` | Pre-built composite UI configurations (deprecated) |
| `trait/` | Reusable behavior mixins |
| `defaults/` | Default configurations |

## Key Concepts

### Workflows (`workflow/`)

// TODO: wrong concept

State machines that orchestrate API calls and UI updates. Each workflow manages:
- Session lifecycle (restart, query, response)
- Data flow via Hub
- View state synchronization
- Interaction tracking

**Available workflows**: `Ask`, `Search`, `HybridSearch`, `Explore`, `Recommendation`

### Elements (`element/`)

Web Components following the `<miso-*>` naming convention:

- **Containers**: Top-level elements that own a workflow
  - `<miso-ask>`, `<miso-search>`, `<miso-explore>`, `<miso-recommendation>`, `<miso-hybrid-search>`

- **Roles**: Child elements bound to specific data roles
  - Query: `<miso-query>`
  - Results: `<miso-answer>`, `<miso-sources>`, `<miso-products>`, `<miso-results>`
  - Navigation: `<miso-follow-up-questions>`, `<miso-related-questions>`
  - Utility: `<miso-feedback>`, `<miso-error>`, `<miso-facets>`, `<miso-total>`

- **Combos**: Pre-configured composite elements (deprecated)
  - `<miso-ask-combo>`

### Actors (`actor/`)

Components that subscribe to and publish on the Hub:
- `DataActor` - Fetches data from API based on requests
- `ViewsActor` - Manages view state for each role
- `TrackersActor` - Handles impression/click/viewable tracking
- `InteractionsActor` - Sends interaction events to API
- `SessionMaker` - Manages session lifecycle

### Hub

Central pub/sub state manager connecting workflows and actors. Fields include:
- `session` - Current session object
- `request` - API request parameters
- `data` - Response data
- `view(role)` - View state per role
- `tracker(role, event)` - Tracking state

### Layouts (`layout/`)

Rendering strategies for each role. Registered via `plugin.layouts.register()`.

Types: `input`, `list`, `text`, `container`, `error`, `button`, etc.

### Roles & Status

**Roles** (from `constants.js`): Define what data a view displays
- Content: `answer`, `question`, `sources`, `products`, `results`
- Navigation: `follow_up_questions`, `related_questions`, `query_suggestions`
- Meta: `feedback`, `error`, `total`, `facets`

**Status**: Workflow/view lifecycle states
- `initial` → `loading` → `ready` / `erroneous`
- `ongoing` (streaming) → `done`

## Entry Point

```javascript
// plugin.js exports UiPlugin
// Installed automatically with full SDK, or manually:
MisoClient.plugins.use('std:ui');

// Access via client instance:
const client = new MisoClient({ apiKey });
client.ui.ask;           // Ask workflow
client.ui.search;        // Search workflow
client.ui.recommendations; // Recommendations
```

## Event Flow

1. User interacts with `<miso-query>` element (ask, hybrid-search, search, etc.), or start by calling `start()` on the workflow instance (explore, recommendations).
2. Container element triggers workflow request
3. Workflow publishes request to Hub
4. `DataActor` fetches from API, publishes response
5. `ViewsActor` updates view states per role
6. Layout renders updated content in elements
7. `TrackersActor` observes visibility, triggers interactions
8. `InteractionsActor` sends tracking data to API
