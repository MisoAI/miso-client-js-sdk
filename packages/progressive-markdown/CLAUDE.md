# CLAUDE.md

Guidance for working with the `@miso.ai/progressive-markdown` package.

## Build & Test Commands

```bash
# Run unit tests (also available from repo root: npm run test:pm)
npm run test --workspace=packages/progressive-markdown

# Render fuzz: sweep n seeds, or replay one specific seed
SEEDS=1000 npm run test:pm
SEED=943595528 npm run test:pm

# Record a seeded run as a content-based regression fixture
node test/bin/record.js <seed> [description]

# Build CJS from source
npm run build --workspace=packages/progressive-markdown
```

## Package Purpose

Utilities for progressive/streaming markdown rendering, enabling real-time display of markdown content as it's being generated (e.g., from LLM streaming responses).

## Architecture

### Package Structure

```
src/
├── index.js              # Main entry point, all exports
├── parser.js             # Markdown parser (unified + remark + rehype)
├── compiler.js           # HAST to HTML compiler
├── renderer.js           # Core progressive renderer orchestrator
├── controller.js         # DOM update controller with animation pacer
├── query.js              # Tree query engine: incremental parsing, closure-aware
│                         #   positions, conflict-driven operation generation
├── trees.js              # Tree utilities: linking, bounds, boundary-closure search,
│                         #   safe bound, conflict detection
├── test-tools.js         # Differential test harness (TestRunner, record/replay, stats)
├── model/
│   ├── position.js       # Position types (EMPTY, INTERIOR, INTERMEDIATE, PIVOTAL)
│   ├── operation.js      # DOM operations (CLEAR, SET, APPEND, ASCEND, DESCEND, LEVEL, SOLIDIFY)
│   └── operations.js     # Operation optimization utilities
├── preset/
│   ├── index.js          # Preset resolution system
│   ├── miso.js           # Default Miso preset with citation/follow-up/atomic support
│   ├── slot.js           # Slot-based DOM manipulation variant
│   └── helpers.js        # Preset helper functions
├── rehype-*.js           # Markdown processing plugins (incl. rehype-atomic)
├── styles.js             # CSS class constants
└── utils.js              # Helper functions
test/
├── bin/record.js         # Records a seeded run into a replayable fixture
└── fixtures/*.json       # Content-based regression fixtures (survive lorem changes)
```

### Core Classes

| Class | Purpose |
|-------|---------|
| `Parser` | Wraps unified + remark + rehype pipeline to convert markdown to HAST |
| `Compiler` | Converts HAST nodes to HTML strings |
| `Query` | Manages incremental tree parsing, conflict detection, and operation generation |
| `Renderer` | Orchestrates progressive rendering with cursor-based animation |
| `Controller` | High-level DOM controller integrating pacer for typewriter animation |
| `TestRunner` | Differential harness: actual renderer vs forceOverwrite reference, per step |

### Data Flow

```
Markdown Source → Parser → HAST Tree → Query (tracks bounds/conflicts)
                                          ↓
                          Renderer (cursor management, operations)
                                          ↓
                          Controller (DOM updates, animation)
```

### Key Concepts

**Index Space**: positions are measured in content units — text characters, plus one
intrinsic unit per childless or atomic element. Elements with children derive bounds
from them, so structure itself is otherwise weightless. Zero-width nodes exist (e.g.
a just-opened fence parses to `pre > code > text('')`) and are unaddressable by any
cursor value; the boundary-closure and conflict rules below exist to keep them sound.

**Position Types** (`model/position.js`):
- `EMPTY` - Root with no children
- `INTERIOR` - Cursor inside a text node (mid-character)
- `INTERMEDIATE` - Cursor between nodes
- `PIVOTAL` - Position at ancestor level for efficient tree traversal

**Operation Types** (`model/operation.js`):
- `CLEAR` - `element.innerHTML = ''`
- `SET` - `element.innerHTML = html`
- `APPEND` - `ref.insertAdjacentHTML('beforeend', html)`
- `ASCEND/DESCEND` - Navigate DOM tree level by level (relative)
- `LEVEL` - Absolute seek: from the container, `lastElementChild` × level. The render
  cursor always lives on the right spine, so element depth is a complete coordinate.
  Every `progress()` batch starts with `LEVEL`, so batches never trust the inherited ref
- `SOLIDIFY` - Re-set innerHTML on element (reserved for scoped backtracking)

**Boundary Closure** (`trees.js` search / `query.js`): a boundary shared by a
zero-width run resolves **leftmost while streaming** (the run stays ahead of the
position, uncommitted) and **rightmost at done** (the run is complete and rendered).
`Query` derives the closure from its done state; the from-side follows what previous
frames actually rendered (`_finalized`). The full-render shortcut in `overwrite()` is
right-closed and therefore done-only.

**Safe Bounds**: mid-stream, `safeRightBoundOf` holds back only a **trailing atomic
node** (its interior is opaque to the index space, so rendering it while it may still
grow guarantees repair by overwrite; held, it pops in whole once content follows it or
at done). Deliberately **not** extended to trailing childless elements: the API may
return special childless HTML for UI purposes, and holding one that stays childless
would defer it to done. At done, the bound is the full right bound.

**Atomic Nodes** (`_atomic`): opaque one-unit subtrees — children carry no bounds and
are invisible to the index space. Marked by `rehype-citation-link` (citation links)
and `rehype-atomic` (embedded content: svg, math, iframe, video, ...). An atomic
interior is part of node *identity*: `isSameNode` compares it in full, so any internal
change conflicts at the node's left bound.

**Conflict Detection** (`trees.js` findConflict): compares consecutive parses and
reports the first divergence index. Key rules:
- element props are compared for real (tags outside `SKIP_PROP_COMPARISON`; `className`
  compared separately; `data-tooltip` ignored — tooltip content may depend on data
  outside the source)
- a childless element gaining/losing children conflicts at its left bound (its
  intrinsic unit aliases with its first child's unit)
- appended siblings are conflict-free only when they extend beyond the previous
  tree's **global** right bound (re-parenting can hand them indices another branch
  owned) and have nonzero total width
- removed siblings anchor the conflict at the first removed node's own left bound
- the renderer overwrites only when `prevCursor > conflict.index` (strict: at
  equality, nothing of the conflicting region is rendered yet)

### Preset System

`presetMiso()` is the default configuration for Miso integration:
- Plugins: `remark-gfm`, `rehype-minify-whitespace`, `rehype-link-attrs`,
  citation/follow-up link handlers, `rehype-atomic`
- Options: `onCitationLink`, `onRefChange`, `onDone`, `getSource`, `processMarkdown`,
  `atomicTags`, `variant`

## Testing

`TestRunner` runs a differential test: the actual renderer against a `forceOverwrite`
reference, comparing HTML after every step, plus a final check against `transformSync`
ground truth. `runner.stats` reports `{ conflicts, overwrites, updates }` (the
reference overwrites every update, doubling as the update count); the render test
prints a `[total]` rate line. Regression runs are pinned as **content-based fixtures**
(recorded step streams, `TestRunner` options `record`/`replay`) so they survive
changes to the lorem implementation. The uvu test script ignores `test/bin/` and
`test/fixtures/`.

## Key Dependencies

- `unified` - Text processing pipeline
- `remark-parse` / `remark-gfm` - Markdown parsing with GFM support
- `remark-rehype` - Convert Markdown AST to HTML AST
- `hast-util-to-html` - Convert HTML AST to string
- `unist-util-visit` - Tree traversal utilities

## Usage Pattern

```javascript
import { Controller, presetMiso } from '@miso.ai/progressive-markdown';

const controller = new Controller(element, {
  presets: [presetMiso({
    onCitationLink: (methods, { source, index }) => { /* ... */ },
    getSource: (index) => sources[index],
  })],
  speed: 50,
  acceleration: 0.8,
});

// As streaming data arrives:
controller.update(response);  // { answer: "...", answer_stage: "...", finished: false }
```

## Important Conventions

- State is frozen (`Object.freeze`) after each update for immutability
- Uses `miso-typewriter` and `miso-markdown` CSS classes for styling hooks
- `requestAnimationFrame` used for smooth DOM updates
- Renderer callbacks: `onRefChange`, `onDone`, `onDebug`, custom `applyOperation`;
  `Renderer.update` state includes per-frame `conflict` and `overwrite` flags
- Custom `applyOperation` implementations (e.g. the slot preset) must handle all
  operation types, including `LEVEL`
