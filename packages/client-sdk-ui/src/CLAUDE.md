# Client SDK UI

The UI package (`std:ui` plugin) provides the presentation layer for Miso SDK: custom elements, layouts, and rendering infrastructure.

The workflow layer (workflow classes, actors, hub, default-options store) lives in `@miso.ai/client-sdk-workflow` — see `packages/client-sdk-workflow/CLAUDE.md` for the hub-and-spoke architecture, workflow class hierarchy, roles/status model, and the end-to-end data flow. This package plugs elements and layouts into those workflows.

## Architecture Overview

```
UiPlugin ('std:ui', singleton)
 ├─ ensures WorkflowPlugin ('std:workflow') is installed
 ├─ provides its Layouts registry to the workflow plugin (setLayouts)
 ├─ seeds default layout options (defaults.js) + ask followUp template
 │  into the workflow plugin's defaults store
 ├─ Layouts registry (layout classes, keyed by type)
 ├─ defines <miso-*> custom elements
 └─ injects client.ui on each MisoClient instance; its workflow accessors
    (search, asks, ...) delegate to client.workflows for backward compatibility
```

Key points that are easy to get wrong:

- **Elements render nothing.** A container element (e.g. `<miso-ask>`) locates its workflow on `connectedCallback()` and registers itself; child role elements register through their container. The workflow's `ViewsActor` then creates one `ViewActor` per element, pairing it with a **layout instance** for that role. The layout writes DOM into the element.
- Layouts are **instances created per view** from classes registered in the plugin's `Layouts` registry (`layout.type` → class), chosen by the workflow's `layouts` options. They are not templates.
- Default layout options per workflow live in `src/defaults.js`, keyed by workflow name, and are seeded into the workflow plugin's defaults store at install — they are not baked into the workflow classes.

## Core Directories

| Directory | Purpose |
|-----------|---------|
| `element/` | Custom HTML elements (`<miso-*>`): thin, render-free DOM anchors that bind themselves to workflows |
| `layout/` | Layout classes (rendering logic), registered by `type` in the plugin's registry, instantiated per view |
| `combo/` | `AskCombo`: programmatic pre-built ask UI (deprecated) |
| `trait/` | Reusable behaviors exposed as `MisoClient.ui.traits` (e.g. `CollapsibleTrait`) |
| `defaults/` | Default templates/phrases/controls for ask and hybrid-search UIs, exposed as `MisoClient.ui.defaults` |
| `defaults.js` | Default layout options of each workflow, seeded into the workflow plugin's store |
| `constants.js` | UI-only constants (`LAYOUT_TYPE`, data attributes); re-exports workflow constants (`ROLE`, `STATUS`, ...) for convenience |

## Elements (`element/`)

Web Components (`<miso-*>`). They contain **no rendering or data logic** — they only establish the DOM binding:

- **Containers** (`element/container/`): own the workflow binding for their subtree.
  - `<miso-ask>` — binds by `parent-question-id` attribute (absent = root ask), or `workflow="active"` to follow `asks.active`
  - `<miso-search>`, `<miso-hybrid-search>` — bind to `client.ui.search` / `.hybridSearch`
  - `<miso-explore>`, `<miso-recommendation>` — bind by `unit-id` attribute
  - `<miso-history>`, `<miso-thread>` — bind to `client.workflows.history` / `.thread`, forming the chat history interface (thread list + conversation panel); their role elements are `<miso-threads>` and `<miso-messages>`. The thread list uses the `threads` layout (a list of `thread` items; selection is part of the data — the workflow stamps `selectedThreadId` into its value and the role mapping decorates each record with `selected` — and the list renders incrementally: appends render new items, while in-place state changes on existing items (selected/unread) are applied by an attribute-sync pass after each render, reading fresh values off the item bindings); the conversation uses the `messages` layout with `message` items (question bubble + answer body, with a per-message loading placeholder while answer contents are fetched); the item template leaves answer bodies blank, and a post-render pass (`_syncAnswers`) fills them by transforming the markdown content into HTML via the `std:ui-markdown` plugin's pure `transform()` (no typewriting), rendered under the `.miso-markdown` styles. A click on a thread item is a navigation action, not a content-engagement click: the layout overrides `_onClick` to emit a `select` view event (no click tracking), which the History workflow handles with `select()`.
- **Role components** (`element/role/`): register with their ancestor container; the role determines which slice of data they display. Either dedicated tags (`<miso-answer>`, `<miso-sources>`, `<miso-products>`, `<miso-query>`, ...) or generic `<miso-component role="...">`. `<miso-results>` is deprecated in favor of `<miso-products>`.
- **Combos** (`element/combo/`): pre-configured composite `<miso-ask-combo>` (deprecated).

Connecting an element to the DOM is what triggers view creation: container `connectedCallback` → `workflow._views.addContainer/addComponent` → `ViewActor` created with a layout instance → rendered as soon as data exists.

## Layouts (`layout/`)

Rendering strategies. A layout class has a static `type` (e.g. `'list'`, `'typewriter'`, `'search-box'`) and is registered in the plugin registry; workflows pick layouts per role via options (`useLayouts({ answer: ['typewriter', {...}] })`). `ViewsActor` instantiates one layout object per view.

Contract: `render(element, data, { notifyUpdate })` is mandatory; `initialize(view)`, `unrender(element)`, `syncSize(element)`, `destroy()` are optional. `notifyUpdate(state)` is how a layout reports its view state back (published to `view:<role>` on the hub) — this drives workflow lifecycle events. A layout can also write to the hub (e.g. `SearchBoxLayout` submits `fields.query()`).

## Entry Point

```javascript
// plugin.js exports UiPlugin
// Installed automatically with full SDK, or manually:
MisoClient.plugins.use('std:ui');

// Access via client instance (canonical, injected by std:workflow):
const client = new MisoClient({ apiKey });
client.workflows.ask;            // root Ask workflow (=== client.workflows.asks.root)
client.workflows.asks;           // Asks context (follow-up chain, .active, .root)
client.workflows.search;         // Search workflow
client.workflows.hybridSearch;   // HybridSearch workflow
client.workflows.recommendations.get(unitId); // Recommendation workflow per unit
client.workflows.explores.get(unitId);        // Explore workflow per unit

// client.ui.search, client.ui.asks, client.ui.sources, ... delegate to
// client.workflows for backward compatibility; client.ui's own surface is only `ready`.
```
