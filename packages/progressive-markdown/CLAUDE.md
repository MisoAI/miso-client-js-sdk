# CLAUDE.md

Guidance for working with the `@miso.ai/progressive-markdown` package.

## Build & Test Commands

```bash
# Run unit tests
npm run test --workspace=packages/progressive-markdown

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
├── query.js              # Tree query engine for incremental rendering
├── trees.js              # Tree manipulation utilities (linking, bounds, searching)
├── model/
│   ├── position.js       # Position types (EMPTY, INTERIOR, INTERMEDIATE, PIVOTAL)
│   ├── operation.js      # DOM operations (CLEAR, SET, APPEND, ASCEND, DESCEND, SOLIDIFY)
│   └── operations.js     # Operation optimization utilities
├── preset/
│   ├── index.js          # Preset resolution system
│   ├── miso.js           # Default Miso preset with citation/follow-up support
│   ├── slot.js           # Slot-based DOM manipulation variant
│   └── helpers.js        # Preset helper functions
├── rehype-*.js           # Markdown processing plugins
├── styles.js             # CSS class constants
└── utils.js              # Helper functions
```

### Core Classes

| Class | Purpose |
|-------|---------|
| `Parser` | Wraps unified + remark + rehype pipeline to convert markdown to HAST |
| `Compiler` | Converts HAST nodes to HTML strings |
| `Query` | Manages incremental tree parsing, conflict detection, and operation generation |
| `Renderer` | Orchestrates progressive rendering with cursor-based animation |
| `Controller` | High-level DOM controller integrating pacer for typewriter animation |

### Data Flow

```
Markdown Source → Parser → HAST Tree → Query (tracks bounds/conflicts)
                                          ↓
                          Renderer (cursor management, operations)
                                          ↓
                          Controller (DOM updates, animation)
```

### Key Concepts

**Position Types** (`model/position.js`):
- `EMPTY` - Root with no children
- `INTERIOR` - Cursor inside a text node (mid-character)
- `INTERMEDIATE` - Cursor between nodes
- `PIVOTAL` - Position at ancestor level for efficient tree traversal

**Operation Types** (`model/operation.js`):
- `CLEAR` - `element.innerHTML = ''`
- `SET` - `element.innerHTML = html`
- `APPEND` - `ref.insertAdjacentHTML('beforeend', html)`
- `ASCEND/DESCEND` - Navigate DOM tree level by level
- `SOLIDIFY` - Re-set innerHTML on element

**Tree Shimming** (`trees.js`):
1. Linking - Adds parent/sibling/child references to tree nodes
2. Bounds patching - Calculates character position bounds for each node

**Character Indexing**: Position is measured by character count (text length), not DOM nodes.

**Safe Bounds**: Before streaming is finished, renderer caps cursor at `safeRightBound` to avoid rendering incomplete nodes.

**Conflict Detection**: Identifies where newly parsed tree differs from previous parse; triggers overwrite if needed.

### Preset System

`presetMiso()` is the default configuration for Miso integration:
- Plugins: `remark-gfm`, `rehype-minify-whitespace`, citation/follow-up link handlers
- Options: `onCitationLink`, `onRefChange`, `onDone`, `getSource`, `processMarkdown`, `variant`

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
- Renderer callbacks: `onRefChange`, `onDone`, `onDebug`, custom `applyOperation`
