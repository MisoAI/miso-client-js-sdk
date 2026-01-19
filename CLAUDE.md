# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies
npm ci

# Build all packages
npm run build

# Run unit tests
npm run test

# Run single package tests (e.g., progressive-markdown)
npm run test --workspace=packages/progressive-markdown

# Start development server (requires demo/.env with DEFAULT_API_KEY)
npm run start

# Run e2e tests with Playwright
npm run e2e

# Run e2e tests with UI
npm run e2e:ui
```

## Architecture

This is a monorepo for Miso's browser JavaScript SDK, enabling integration of Miso's LLM-powered answer and recommendation APIs.

### Package Hierarchy

```
@miso.ai/client-sdk (main entry point)
├── @miso.ai/client-sdk-core      # MisoClient class, API layer, plugin system
├── @miso.ai/client-sdk-ui        # Custom elements, workflows, layouts
├── @miso.ai/client-sdk-ui-markdown  # Markdown rendering extension
├── @miso.ai/client-sdk-dev-tool  # Debug and dry-run plugins
├── @miso.ai/client-sdk-algolia   # Algolia compatibility layer
├── @miso.ai/client-sdk-shopify   # Shopify integration
├── @miso.ai/client-sdk-gtm       # Google Tag Manager integration
├── @miso.ai/commons              # Shared utilities (Component base class, events, etc.)
└── @miso.ai/progressive-markdown # Streaming markdown rendering utilities
```

### Core Patterns

**Component System**: All major classes extend `Component` from commons, providing hierarchical structure with `meta.path`, UUID, and event emission via `_events`.

**Plugin Architecture**: Plugins are registered/used via `MisoClient.plugins`:
- `register()` - makes plugin available
- `use()` - activates plugin
- Plugins implement `install(MisoClient, context)` method
- Standard plugins prefixed with `std:` (e.g., `std:ui`, `std:debug`)

**Entry Points**:
- `index.js` - Full SDK with UI, auto-attaches to window
- `lite.js` - Core only without UI plugin
- `detached/` variants - Don't auto-attach to window

**UI Workflows** (`packages/client-sdk-ui/src/workflow/`): Orchestrate API calls and UI updates for features like Ask, Search, Recommendations, Explore, and HybridSearch.

**Custom Elements**: Defined in `packages/client-sdk-ui/src/element/`, registered via `defineAndUpgrade()`. Main combo element is `<miso-ask-combo>`.

### Build Outputs

- ESM: `src/` (source, used directly via `module` field)
- CJS: `dist/cjs/` (Babel-transpiled)
- UMD: `dist/umd/` (Rollup-bundled, for CDN/browser)
- CSS: `dist/css/` (Sass-compiled)
