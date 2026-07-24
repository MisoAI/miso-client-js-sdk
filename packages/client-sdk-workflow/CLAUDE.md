# Client SDK Workflow

The workflow package (`std:workflow` plugin) hosts the client-agnostic workflow layer of the Miso SDK: workflow classes, actors, and the default-options store. It has no DOM dependency at import time, so it can be loaded and tested in Node. The presentation layer (custom elements, layouts) lives in `client-sdk-ui`, which builds on this package.

## Architecture Overview

The central concept is a **hub-and-spoke model per workflow instance**. Each `Workflow` owns a private `Hub` (a pub/sub state store) and a set of **actors** that only communicate through hub fields — actors never call each other directly. The UI package's custom elements and layouts plug into a workflow's views actor.

```
WorkflowPlugin ('std:workflow', singleton)
 ├─ WorkflowDefaults store (default options per workflow name)
 │    ├─ seeded with non-layout options (api, trackers, pagination, autocomplete, filters)
 │    │  by the plugin itself (default-options.js)
 │    └─ seeded with layout options + UI templates by the UI plugin (std:ui)
 ├─ injects client.workflows on each MisoClient instance (workflows.js):
 │    search, hybridSearch, asks/ask, explores/explore, recommendations/recommendation,
 │    history, conversation; plus events — the per-client event bus (an EventEmitter shared by
 │    all workflow instances of the client, for workflow-to-workflow communication)
 ├─ layouts registry reference, provided by the UI plugin via setLayouts()
 └─ exposed via the `workflows` plugin extension point

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
                     <miso-*> elements + layout instances (client-sdk-ui)
```

Key points that are easy to get wrong:

- The Hub is **per workflow instance**, not global. Two `<miso-ask>` follow-up sections have two hubs.
- Workflows read their default options from the plugin's defaults store at creation (`base.js` → `plugin.defaults.get(name)`; the plugin arrives through the constructor, directly or via the context — never through a module-level singleton, which would create a cyclic import). Keyed by workflow name (`ask`, `search`, `hybrid-search`, `recommendation`, `explore`); defaults must be set before the workflow instance is created. Two workflows (`autocomplete`, `hybrid-search/answer`) receive `defaults` explicitly instead.
- The workflow object itself is the coordinator and public API surface (`query()`, `start()`, `restart()`, `useApi()`, `useLayouts()`, ...). It reads/writes hub fields like the actors do, and derives its lifecycle events from the main role's `view:<role>` state.

## Core Directories

| Directory | Purpose |
|-----------|---------|
| `src/workflow/` | `Workflow` classes plus `WorkflowContext` classes (`Asks`, `Explores`, `Recommendations`) that create and track workflow instances; `options/` holds the configuration/`use*()` system |
| `src/actor/` | The `Hub` itself, hub field names (`fields.js`), and the actors: `SessionMaker`, `DataActor`, `ViewsActor`/`ViewActor`, `TrackersActor`, `InteractionsActor`, `FeedbackActor` |
| `src/util/` | Tracker validation helpers, `ProxyElement` |
| `src/constants.js` | `ROLE`, `STATUS`, `EVENT_TYPE`, `WORKFLOW_CONFIGURABLE`, etc. (layout types stay in the UI package) |
| `src/default-options.js` | Built-in non-layout default options per workflow, seeded into the store by the plugin |
| `src/defaults.js` | `WorkflowDefaults` — the defaults store |
| `src/source.js` | Adapts `client.api.*` into the data source function `DataActor` calls |

## Workflow class hierarchy

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
├── History (thread list of the chat history interface, user history API)
├── Conversation (conversation panel showing one thread at a time, user history API)
└── Autocomplete (attached to query inputs)

WorkflowContext (context.js)
├── Asks — multiple Ask instances forming a follow-up chain
└── UnitWorkflowContext — Explores, Recommendations (instances keyed by unit id)
```

Multi-instance management is a first-class concept, surfaced at `client.workflows` (the `client.ui.*` equivalents delegate here for backward compatibility):

- **Asks**: `client.workflows.asks.root` is the initial question; each follow-up is a *separate* `Ask` workflow keyed by `parentQuestionId` (`getByParentQuestionId(id, { autoCreate })`). Workflows chain via `previous`/`next`, and `asks.active` tracks the currently loading one.
- **Explores/Recommendations**: instances keyed by unit id (`client.workflows.recommendations.get(unitId)`, default unit id `'default'`).
- **Search/HybridSearch**: single lazily-created instances per client (`client.workflows.search`).
- **History/Conversation**: single lazily-created instances per client, forming the chat-history interface (thread list + conversation panel). They never reference each other directly — they communicate over the per-client event bus (`client.workflows.events`) using the `BUS_EVENT` contract (`constants.js`): `thread:select` (History announces a selection; Conversation loads it), `thread:loaded` (Conversation announces a loaded thread; History marks it as read), `thread:updated` / `thread:deleted` (facts emitted after a mutation API call; **each workflow patches its own local data in its bus handler**, so local and remote changes go through the same code path). Note both workflows must be instantiated (accessed) for the bus wiring to be live. Thread-record field access is centralized in `src/util/threads.js` because the history API shape is still a prototype. Conversation's data flow takes **two requests per session**, both going down the standard data path via `_request()` (the search-based query/more pattern, split by `request.type` — `REQUEST_TYPE.THREAD` head / `REQUEST_TYPE.ANSWERS` follow-up — but to *different API paths*, both resolved in `source.js`): the head request (`GET threads/{id}`) yields turns as question ids; the follow-up (`ask.answers`, api group/name overridden per request from the resolved `answers` options — a configurable feature, overridable via `useAnswers()`) carries the pending `question_ids`, and its response is merged into the head data's messages in `_updateDataInHub` (`mergeAnswersDataFromResponse`, the `concatItemsFromMoreResponse` analogue) — its loading update keeps the head data on display, and the head request is restored on the merged data, so the follow-up stays an internal detail.

Workflows are configured via `use*()` methods (`useApi`, `useLayouts`, `useDataProcessor`, ...) from `workflow/options/`; options cascade defaults store → context → workflow.

## Default options

`WorkflowDefaults.set(name, options)` merges shallowly per feature key. Precedence at resolution: store defaults < context options < workflow-local `use*()` options.

- The **workflow plugin** seeds everything except layouts (`default-options.js`).
- The **UI plugin** seeds `layouts` (and the ask `templates.followUp`) at its install.
- Integrators may override via the `workflows` extension point or `MisoClient.plugins.get('std:workflow').defaults.set(...)` — before workflows are created.

## Hub & Actors

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

## Roles & Status

**Roles** (`constants.js` `ROLE`): identify what data slice a view displays. Each workflow declares its member roles, a `main` role (answer for ask, products for search), and per-role data mappings (`ROLES_OPTIONS` in each workflow file).

**Status** (view state): `initial` → `loading` → `ready` | `erroneous`, with `ongoing: true` while a streamed answer is still updating. Workflow lifecycle **events** (emitted once per session, derived from the main role's view state): `loading`, `ready`, `done`, `error`, `interrupt` (superseded by a new question), `finally`.

## Data Flow (one query, end to end)

1. Query enters: user submits in the search box layout (which updates hub field `query`), or code calls `workflow.query({ q })`; unit workflows (explore, recommendation) start via `start()` instead.
2. Workflow merges API options with the request and updates hub field `request` (tagged with the current session).
3. `DataActor` picks up `request`, calls the API through `source.js`; for streaming answers it iterates the async response and updates `response` repeatedly. Responses for stale sessions are dropped.
4. Workflow picks up `response`, runs the data pipeline (status/meta stamping, revision check, custom `dataProcessor` passes) and updates `data`.
5. `ViewsActor` picks up `data` and refreshes every view: each `ViewActor` slices data by its role mapping and calls `layout.render(element, data, { notifyUpdate })`.
6. Layouts call `notifyUpdate()` → view state published to `view:<role>`; the workflow watches the main role's view state to emit lifecycle events (`loading`, `ready`, `done`, ...).
7. `TrackersActor` observes rendered items for impression/viewable/click and triggers `tracker`; the workflow builds the interaction payload (session, request, miso_id, custom context) and triggers `interaction`; `InteractionsActor` sends it to the API.
8. `restart()` starts a new session: in-flight fetches are aborted, stale hub data is ignored, and (for Ask) downstream follow-up workflows are destroyed.
