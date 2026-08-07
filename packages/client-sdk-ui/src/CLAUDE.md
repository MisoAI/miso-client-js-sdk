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
  - `<miso-history>`, `<miso-conversation>` — bind to `client.workflows.history` / `.conversation`, forming the chat history interface (thread list + conversation panel); their role elements are `<miso-threads>`, `<miso-new-thread>`, `<miso-messages>`, `<miso-title>`, `<miso-rename>` and `<miso-subscription>`. The new-thread button is its own component (`<miso-new-thread>`, role `new_thread`), *not* part of the thread list, so it renders regardless of the list state (loading, empty, erroneous); it uses the generic `button` layout — an icon and a label, both configurable (`icon`, `text`), emitting a `submit` view event when clicked — which History answers by clearing the selection and resetting the conversation panel to new-thread mode. The thread list uses the `threads` layout (a list of `thread` items — the `<li>` itself is the item, carrying `data-role="item"`, the thread id and the state attributes; the thread template renders it directly, skipping the stock li-wrapper + role-body split that exists for anchor-bodied product items; selection is part of the data — `selectedThreadId` lives in the workflow's committed value and each record carries its `selected` flag right in the data layer (stamped by the workflow's default data pass; the role mapping is a plain slice) — and the list renders incrementally: appends render new items, while in-place state changes on existing items (selected/unread) are applied by an attribute-sync pass after each render, reading fresh values off the item bindings); the conversation uses the `messages` layout with `message` items (question bubble + answer body, with a per-message loading placeholder while answer contents are fetched), rendered incrementally; each question bubble carries its authorship — `data-author` ('Written by Miso' for questions whose `metadata.miso_generated_by` is `answer_update_monitor`, read via `getGeneratedBy`; the user's own questions carry no label; the label renders as a CSS `attr()` badge overlapping the bubble's top-left border, and monitor-generated bubbles take a distinct background) — stamped by the item template and re-applied by the sync pass, since the metadata arrives with the answers response after the stub render; the item template leaves question/answer contents blank, and a post-render pass (`_syncMessages`) fills them in place — finished answers via the `std:ui-markdown` plugin's pure `transform()`, and `live`/streaming answers (posted follow-ups) via a per-message typewriter (progressive markdown renderer + paced cursor). The conversation's header roles come from the open thread's record: `<miso-title>` (role `title`) renders its title with the generic `text` layout, `<miso-rename>` (role `rename`) renders a pencil button with the generic `button` layout whose **`prompt` option** turns the click into ask-then-submit: the shared prompt dialog opens pre-filled with the control's current value — the role's mapped data value, read off the latest rendered state (`_currentValue()`; `RafLayout` retains it per element) — and the `submit` view event carries the confirmed text as `value`, which Conversation answers with `rename(value)` — and `<miso-subscription>` (role `subscription`) renders the answer-updates toggle with the **`checkbox` layout** — a button-layout subclass; a checkbox that looks like a button (`<button role="switch" aria-checked>` with `data-checked`, an icon and label per state via `icon`/`text` and `checkedIcon`/`checkedText`). Its checked state comes from the data, so a click emits a `change` view event carrying only the requested state (`{ checked }`), read off the rendered element; the Conversation workflow answers it with `subscribe()`/`unsubscribe()` and the new state arrives back down the data path. Note the `visible-when` mechanism forces `display: block !important` on the element it toggles, so a page that lays such an element out as a flex row needs an inner wrapper (as the history demo pages do for the header). A `<miso-query>` (search-box layout) inside `<miso-conversation>` sends questions through the hub `query` field — follow-ups, or the first question of a new thread (the conversation starts in new-thread mode). With `messages`/`threads` registered as data roles, `<miso-conversation>` carries the `empty`/`nonempty` content status, which pages use to center the composer in the empty (new-thread) state. The `threads` layout's post-render sync also applies in-place record changes (title, `data-thread-id`) so renames and placeholder→real-thread resolutions reflect without item re-renders. A click on a thread item is a navigation action, not a content-engagement click: the layout overrides `_onClick` to emit a `select` view event (no click tracking), which the History workflow handles with `select()`. Each item also carries a context menu (vertical dots, revealed on hover) with thread actions, each going through a shared modal dialog util (promise-returning native `<dialog>`s on a common core, `util/modal.js`): rename asks via `prompt()` (`util/prompt.js`, a modal text input pre-filled with the current title — Enter confirms, resolving to the trimmed text, or undefined on cancel; exposed as `MisoClient.ui.prompt`) and emits a `rename` view event, handled by the History workflow with `rename()`; delete asks via `confirm()` (`util/confirm.js`, exposed as `MisoClient.ui.confirm`) and emits a `delete` view event, handled with `delete()`.
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
