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
 │    all workflow instances of the client; no built-in workflow uses it since
 │    History/Conversation switched to direct calls)
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
├── Conversation (conversation panel showing one thread at a time, user history API; a subworkflow of History)
└── Autocomplete (attached to query inputs)

WorkflowContext (context.js)
├── Asks — multiple Ask instances forming a follow-up chain
└── UnitWorkflowContext — Explores, Recommendations (instances keyed by unit id)
```

Multi-instance management is a first-class concept, surfaced at `client.workflows` (the `client.ui.*` equivalents delegate here for backward compatibility):

- **Asks**: `client.workflows.asks.root` is the initial question; each follow-up is a *separate* `Ask` workflow keyed by `parentQuestionId` (`getByParentQuestionId(id, { autoCreate })`). Workflows chain via `previous`/`next`, and `asks.active` tracks the currently loading one.
- **Explores/Recommendations**: instances keyed by unit id (`client.workflows.recommendations.get(unitId)`, default unit id `'default'`).
- **Search/HybridSearch**: single lazily-created instances per client (`client.workflows.search`).
- **History/Conversation**: the chat-history interface (thread list + conversation panel). History is a single lazily-created instance per client; Conversation is its **subworkflow** (like hybrid-search's answer and autocomplete), **lazily constructed** by the `client.workflows.conversation` accessor (the single entry point) and stored on History as `_conversation`; History guards every direct call to it with a presence check, so the thread list works standalone until the accessor brings the panel to life. The two coordinate by **direct method calls** (the event bus, `client.workflows.bus`, is no longer involved): History's `select()` loads the selection into the conversation panel (`_onThreadSelect`); Conversation marks a loaded thread as read via History's `markAsRead` — right at load() time, so the unread dot clears immediately; the panel's displayed record simply never carries the unread flag — an open thread is read by definition (`_mergeThreadData` stamps `has_new: false` whatever the record or a stale in-flight response says); mutations (`rename`, `markAsRead`, `subscribe`/`unsubscribe` — answer-updates subscription; `subscribed` and `has_new` are independent facts, and the unread presentation (`isThreadUnread`, the UI red dot) derives from `subscribed && has_new`, `delete` — one id or an array, `deleteAll`; thread-suffix-free like `select`, the thread being implied by the workflow) call the API, then apply the fact to **both panels** through the shared handler methods (`_applyThreadUpdate` / `_applyThreadDeletion` → `_onThreadUpdated` / `_onThreadDeleted` / `_onAllThreadsDeleted` on each side), so a change goes through the same code path whichever panel it originated from. Conversation's member roles cover the panel's own widgets: `messages`, `query`, plus the header roles `title`, `rename` and `subscription`, whose mappings are **dot-path strings** into the open thread's record (`'thread.title'`, `'thread.title'`, `'thread.subscribed'` — `asMappingFunction` resolves dot-separated paths against the data value); the rename button pre-fills its dialog with its mapped value and its `submit` event carries the confirmed text into `rename(value)` (`thread.title`, `!!thread.subscribed`) — the subscription checkbox therefore renders its checked state from data, and its `change` view event (`_onViewSubscriptionChange`) routes to subscribe()/unsubscribe(); neither is a *data* role, so they do not affect the container's empty/nonempty status. Conversation also exposes the thread operations on the thread on display — `rename(title)`, `subscribe()`, `unsubscribe()`, `delete()`, thin delegates to the History mutations that require a loaded thread (a thread being created has no server identity to operate on). Thread-record field access is centralized in `src/util/threads.js` because the history API shape is still a prototype; the response-shape fallbacks live at the API boundary instead (`processResponse()` in `source.js` fills a thread record's canonical fields from their alternatives: `question_id` -> `thread_id`, `time` -> `updated_at`), so the workflows read canonical fields only. **A thread's id is the id of its first question** — a contract the new-thread flow relies on. The workflows are written against the resource-style user history API (`client-sdk-core`'s `api/history.js`, not released yet); the **deployed v0 API** (flat, POST-only, threads addressed by root question id) is adapted behind that same interface by `api/history.0.js` in the core package — currently the one in use — so nothing here is version-aware. One v0 consequence surfaces here: the thread detail carries no metadata, so the history selection passes the thread's **list record** along (`select()` -> `load(threadId, { data })`), and Conversation merges it under the head response's thread record (`_mergeThreadRecord`). Conversation's processing splits along the pipeline deliberately: `_defaultProcessData` **homogenizes** every request type's value to the canonical `{ thread, messages }` shape but merges nothing, while merging into the current data happens in `_updateDataInHub` — past the custom `dataProcessor` passes — so each piece of data runs through the custom processors exactly once, in one shape. Conversation's data flow takes **two requests per session**, both going down the standard data path via `_request()` (the search-based query/more pattern, split by `request.type` — `REQUEST_TYPE.THREAD` head / `REQUEST_TYPE.ANSWERS` follow-up — but to *different API paths*, both resolved in `source.js`): the head request (`GET threads/{id}`) yields turns as question ids; the follow-up (`ask.answers`, api group/name overridden per request from the resolved `answers` options — a configurable feature, overridable via `useAnswers()`) carries the unsettled `question_ids` — and **polls by answer state**: any non-live message whose answer is absent or `finished: false` keeps the answers request re-polling (`answers.pollingInterval`, default 1s), so an answer still generating is picked up even after switching away and back to the thread; its response is merged into the head data's messages in `_updateDataInHub` (`mergeAnswersDataFromResponse`, the `concatItemsFromMoreResponse` analogue) — its loading update keeps the head data on display, and the head request is restored on the merged data, so the follow-up stays an internal detail. Conversation also posts **questions** (`send(question)`, fed by the hub `query` field from the search-box layout): a third request type (`REQUEST_TYPE.QUERY` — the conventional main-query type; api from the `query` configurable, overridable via `useQuery()`, `ask.questions` + `parent_question_id`) whose streamed responses merge into the last message pair; the question bubble is appended optimistically with a `live: true` mark (the UI typewrites live answers). History's new-chat action (wired to the standalone new-thread component (`<miso-new-thread>`), `ROLE.NEW_THREAD`, via its `submit` view event) clears the selection and calls the conversation's `new()`, which enters new-thread mode — a no-op (no new session, no re-render) when the panel already sits on an untouched new thread, i.e. it holds neither a thread id nor a placeholder id; pass `{ force: true }` to `new()` to reset regardless. Conversation starts (and resets) in **new-thread mode**: a local placeholder thread with no messages, committed as ready data. `send(question)` posts to the current thread, or, with no thread loaded, starts a new one: it announces the placeholder to History (`_onConversationNew`: appends and selects a placeholder item), posts the question as a root ask, and — once the response carries the question id — settles the placeholder **immediately** (`_resolveIfNecessary`, on the first response chunk — dispatched only for commits carrying an actual response value, never the loading update): that question id **is** the thread id, and the resolution involves **no server round trip at all** — no reload, no thread-detail fetch. It is announced to History (`_onConversationResolve(placeholderId, threadId)` — the thread id being the only thing the resolution gains), which settles its own listed placeholder item around it, and the panel settles its own displayed record likewise (`settlePlaceholder`, shared in `util/threads.js`) — with the placeholder gone from both records, the resolution structurally cannot fire twice, so no dedup flag is needed. The local fields (title, updated_at) stand in until the next thread list load; the posted answer just keeps streaming into the panel. Leaving the panel mid-creation (selecting another thread, or new chat) is safe either way: if the response hadn't arrived by the switch, it is **scavenged from the expired session**: the posting request carries the placeholder record (`send` buries it in the request object), DataActor announces dropped stale responses on the trigger-only hub field `expired-response` instead of discarding them silently, and Conversation (`_onExpiredResponse`, guarded by the QUERY request type) reads the question id — the thread id, by contract — out of the expired response and announces the resolution to History directly (the panel, on another session by now, is left alone); an announcement finding no placeholder item (already settled in-session before the switch) is a no-op. Either way the placeholder item stays in the list and settles in place into a selectable record — never removed, no list reload. A thread being created has **no thread id at all**: its placeholder record is keyed by a local `placeholder_id`, so nothing can address it as a thread server-side. Neither workflow keeps state fields of its own — everything lives in the data layer: Conversation's `threadId` is the committed thread record's id, falling back to the in-flight head request (which carries `threadId` and the list record explicitly), the creating state is recognized by the committed placeholder record, and History's selection (`selectedId`) is the `selectedThreadId` of its committed value — mutations patch it together with the threads in one commit, `_defaultProcessData` carries it over onto fresh server responses (which bring none of their own), so it survives a refresh, and the same pass stamps each record's `selected` flag, so the thread items carry their selection state in the data layer — the thread-id-presence checks in the view action handlers (select, delete) are what keeps a placeholder item from reaching the API. Item identity for selection and lookup is the thread id, falling back to the placeholder id (inlined as `getThreadId(thread) || getPlaceholderId(thread)`; there is deliberately no combined helper).

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
- `response` — raw API response(s); streamed responses emit repeatedly; a response arriving after its session expired never enters the data flow, but is announced on the trigger-only `expired-response` field for the workflow to salvage what it can
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
