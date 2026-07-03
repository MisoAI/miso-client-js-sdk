# Client SDK UI

The UI package (`std:ui` plugin) provides the presentation layer for Miso SDK, including custom elements, workflows, and rendering infrastructure.

## Architecture Overview

The central concept is a **hub-and-spoke model per workflow instance**. Each `Workflow` owns a private `Hub` (a pub/sub state store) and a set of **actors** that only communicate through hub fields — actors never call each other directly. Custom elements and layouts are not peers of workflows; they plug into a workflow's views actor.

```
UiPlugin ('std:ui', singleton)
 ├─ Layouts registry (layout classes, keyed by type)
 ├─ defines <miso-*> custom elements
 ├─ injects client.ui on each MisoClient instance
 └─ WorkflowContexts per client: Asks, Explores, Recommendations

Workflow instance (e.g. one Ask)
 │ owns
 ▼
┌────────────────────────── Hub (private to this workflow) ──────────────────────────┐
│  fields: session, query, request, response, data, view:<role>, tracker,            │
│          interaction, input, completions, filters, feedback, more                  │
└─────────────────────────────────────────────────────────────────────────────────────┘
   ▲              ▲               ▲                    ▲                  ▲
SessionMaker   DataActor      ViewsActor          TrackersActor    InteractionsActor
(session)      (request →     (data → render      (visibility →    (interaction →
                response)      via ViewActors)     tracker)         send to API)
                                   │
                                   │ one ViewActor per element = (element, layout, role)
                                   ▼
                     <miso-*> elements (passive DOM anchors)
                     Layout instances (do the actual rendering)
```

Key points that are easy to get wrong:

- The Hub is **per workflow instance**, not global. Two `<miso-ask>` follow-up sections have two hubs.
- **Elements render nothing.** A container element (e.g. `<miso-ask>`) locates its workflow on `connectedCallback()` and registers itself; child role elements register through their container. The workflow's `ViewsActor` then creates one `ViewActor` per element, pairing it with a **layout instance** for that role. The layout writes DOM into the element.
- Layouts are **instances created per view** from classes registered in the plugin's `Layouts` registry (`layout.type` → class), chosen by the workflow's `layouts` options. They are not templates.
- The workflow object itself is the coordinator and public API surface (`query()`, `start()`, `restart()`, `useApi()`, `useLayouts()`, ...). It reads/writes hub fields like the actors do, and derives its lifecycle events from the main role's `view:<role>` state.

## Core Directories

| Directory | Purpose |
|-----------|---------|
| `workflow/` | `Workflow` classes plus `WorkflowContext` classes (`Asks`, `Explores`, `Recommendations`) that create and track workflow instances; `options/` holds the configuration/`use*()` system |
| `actor/` | The `Hub` itself, hub field names (`fields.js`), and the actors: `SessionMaker`, `DataActor`, `ViewsActor`/`ViewActor`, `TrackersActor`, `InteractionsActor`, `FeedbackActor` |
| `element/` | Custom HTML elements (`<miso-*>`): thin, render-free DOM anchors that bind themselves to workflows |
| `layout/` | Layout classes (rendering logic), registered by `type` in the plugin's registry, instantiated per view |
| `combo/` | `AskCombo`: programmatic pre-built ask UI (deprecated) |
| `trait/` | Reusable behaviors exposed as `MisoClient.ui.traits` (e.g. `CollapsibleTrait`) |
| `defaults/` | Default templates/phrases/controls for ask and hybrid-search UIs, exposed as `MisoClient.ui.defaults` |
| `source.js` | Adapts `client.api.*` into the data source function `DataActor` calls |

## Key Concepts

### Workflows (`workflow/`)

A workflow is **not a state machine** — it is a `Component` that owns a hub + actors, exposes the feature's public API, and holds per-question/per-unit state. Its "state" lives in hub fields; status is derived from them.

Class hierarchy (matters when tracing behavior — much logic lives in the mid-tier classes):

```
Workflow (base.js: hub, actors, session, data pipeline, interactions)
├── AnswerBasedWorkflow (query flow, answer/citation handling, feedback)
│   ├── Ask
│   └── HybridSearchAnswer (internal to HybridSearch)
├── SearchBasedWorkflow (products/results, pagination, facets)
│   ├── Search
│   └── HybridSearch
├── UnitWorkflow (bound to a unit id, started via start())
│   ├── Explore
│   └── Recommendation
└── Autocomplete (attached to query inputs)

WorkflowContext (context.js)
├── Asks — multiple Ask instances forming a follow-up chain
└── UnitWorkflowContext — Explores, Recommendations (instances keyed by unit id)
```

Multi-instance management is a first-class concept:

- **Asks**: `client.ui.asks.root` is the initial question; each follow-up is a *separate* `Ask` workflow keyed by `parentQuestionId` (`getByParentQuestionId(id, { autoCreate })`). Workflows chain via `previous`/`next`, and `asks.active` tracks the currently loading one.
- **Explores/Recommendations**: instances keyed by unit id (`client.ui.recommendations.get(unitId)`, default unit id `'default'`).
- `client.ui.search` / `client.ui.hybridSearch` are single lazily-created instances per client.

Workflows are configured via `use*()` methods (`useApi`, `useLayouts`, `useDataProcessor`, ...) from `workflow/options/`; defaults cascade context → workflow.

### Elements (`element/`)

Web Components (`<miso-*>`). They contain **no rendering or data logic** — they only establish the DOM binding:

- **Containers** (`element/container/`): own the workflow binding for their subtree.
  - `<miso-ask>` — binds by `parent-question-id` attribute (absent = root ask), or `workflow="active"` to follow `asks.active`
  - `<miso-search>`, `<miso-hybrid-search>` — bind to `client.ui.search` / `.hybridSearch`
  - `<miso-explore>`, `<miso-recommendation>` — bind by `unit-id` attribute
- **Role components** (`element/role/`): register with their ancestor container; the role determines which slice of data they display. Either dedicated tags (`<miso-answer>`, `<miso-sources>`, `<miso-products>`, `<miso-query>`, ...) or generic `<miso-component role="...">`. `<miso-results>` is deprecated in favor of `<miso-products>`.
- **Combos** (`element/combo/`): pre-configured composite `<miso-ask-combo>` (deprecated).

Connecting an element to the DOM is what triggers view creation: container `connectedCallback` → `workflow._views.addContainer/addComponent` → `ViewActor` created with a layout instance → rendered as soon as data exists.

### Hub & Actors (`actor/`)

`Hub` is a minimal pub/sub store: `update(field, state)` (persist + emit) and `trigger(field, payload)` (emit only). All coordination goes through these fields (see `actor/fields.js`):

- `session` — current session (uuid); stale-session data is discarded everywhere
- `query` — user query submission (from search box layout or `workflow.query()`)
- `request` — resolved API request (workflow merges api options + session)
- `response` — raw API response(s); streamed responses emit repeatedly
- `data` — processed response (status, revision-guarded) that views consume
- `view:<role>` — per-role view state (status, ongoing, session, meta)
- `tracker` / `interaction` — tracking events and outgoing interaction payloads

Actors, each subscribing to some fields and updating others:

- `SessionMaker` — creates sessions on `restart()`
- `DataActor` — `request` → calls the API source → `response`; handles async-iterable (streaming) responses and abort-on-new-session
- `ViewsActor` — `data` → refreshes its `ViewActor`s; manages element/layout pairs, per-role data slicing (role mappings), and empty-state detection
- `TrackersActor` — observes rendered items (impression/viewable/click) → `tracker`
- `InteractionsActor` — `interaction` → sends to Miso API via the client

### Layouts (`layout/`)

Rendering strategies. A layout class has a static `type` (e.g. `'list'`, `'typewriter'`, `'search-box'`) and is registered in the plugin registry; workflows pick layouts per role via options (`useLayouts({ answer: ['typewriter', {...}] })`). `ViewsActor` instantiates one layout object per view.

Contract: `render(element, data, { notifyUpdate })` is mandatory; `initialize(view)`, `unrender(element)`, `syncSize(element)`, `destroy()` are optional. `notifyUpdate(state)` is how a layout reports its view state back (published to `view:<role>` on the hub) — this drives workflow lifecycle events. A layout can also write to the hub (e.g. `SearchBoxLayout` submits `fields.query()`).

### Roles & Status

**Roles** (`constants.js` `ROLE`): identify what data slice a view displays — `answer`, `question`, `reasoning`, `sources`, `products`, `results`, `images`, `related_resources`, `follow_up_questions`, `related_questions`, `query_suggestions`, `affiliation`, `facets`, `total`, `feedback`, `error`, `container`, etc. Each workflow declares its member roles, a `main` role (answer for ask, products for search), and per-role data mappings.

**Status** (view state): `initial` → `loading` → `ready` | `erroneous`, with `ongoing: true` while a streamed answer is still updating. Workflow lifecycle **events** (emitted once per session, derived from the main role's view state): `loading`, `ready`, `done`, `error`, `interrupt` (superseded by a new question), `finally`.

## Entry Point

```javascript
// plugin.js exports UiPlugin
// Installed automatically with full SDK, or manually:
MisoClient.plugins.use('std:ui');

// Access via client instance:
const client = new MisoClient({ apiKey });
client.ui.ask;            // root Ask workflow (=== client.ui.asks.root)
client.ui.asks;           // Asks context (follow-up chain, .active, .root)
client.ui.search;         // Search workflow
client.ui.hybridSearch;   // HybridSearch workflow
client.ui.recommendations.get(unitId); // Recommendation workflow per unit
client.ui.explores.get(unitId);        // Explore workflow per unit
```

## Data Flow (one query, end to end)

1. Query enters: user submits in the search box layout (which updates hub field `query`), or code calls `workflow.query({ q })`; unit workflows (explore, recommendation) start via `start()` instead.
2. Workflow merges API options with the request and updates hub field `request` (tagged with the current session).
3. `DataActor` picks up `request`, calls the API through `source.js`; for streaming answers it iterates the async response and updates `response` repeatedly. Responses for stale sessions are dropped.
4. Workflow picks up `response`, runs the data pipeline (status/meta stamping, revision check, custom `dataProcessor` passes) and updates `data`.
5. `ViewsActor` picks up `data` and refreshes every view: each `ViewActor` slices data by its role mapping and calls `layout.render(element, data, { notifyUpdate })`.
6. Layouts call `notifyUpdate()` → view state published to `view:<role>`; the workflow watches the main role's view state to emit lifecycle events (`loading`, `ready`, `done`, ...).
7. `TrackersActor` observes rendered items for impression/viewable/click and triggers `tracker`; the workflow builds the interaction payload (session, request, miso_id, custom context) and triggers `interaction`; `InteractionsActor` sends it to the API.
8. `restart()` starts a new session: in-flight fetches are aborted, stale hub data is ignored, and (for Ask) downstream follow-up workflows are destroyed.
