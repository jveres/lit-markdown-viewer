# lit-markdown-viewer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Lit](https://img.shields.io/badge/Lit-3.x-324FFF.svg)](https://lit.dev/)

A high-performance Lit Web Component for rendering markdown with streaming support, optimized for LLM chat interfaces.

**[Live Demo](https://jveres.github.io/lit-markdown-viewer)** · **[Interactive Playground](playground.html)** · [Report Bug](https://github.com/jveres/lit-markdown-viewer/issues) · [Request Feature](https://github.com/jveres/lit-markdown-viewer/issues)

## Features

- **Streaming Support** - Optimized for real-time content updates with adaptive throttling and DOM morphing
- **Element-Level Diffing** - Skips unchanged blocks during streaming (~99% skip rate)
- **Syntax Highlighting** - Code blocks with language detection and copy button
- **Math Rendering** - KaTeX with lazy loading (77KB saved when unused)
- **GitHub Flavored Markdown** - Tables, task lists, strikethrough, alerts, footnotes
- **Smart Caching** - LRU caches for rendered content, KaTeX output, and DOM state (~10MB budget)
- **Cursor Animation** - Blinking cursor during streaming with focus-aware styling (solid when focused, hollow frame when unfocused)
- **Dark Mode** - Full dark theme support via CSS class
- **XSS Protection** - Comprehensive security against script injection, event handlers, and malicious URLs (69 security tests)

## Installation

```bash
npm install
```

## Development

Start the dev server:

```bash
npm run dev
```

Then open http://localhost:5173 in your browser.

## Demo Features

The [live demo](https://jveres.github.io/lit-markdown-viewer) includes:

- **Streaming simulation** with configurable speed and latency
- **Initial latency option** - 2s delay before content starts (shows cursor blinking)
- **Collapsible controls** - Collapsed by default on mobile
- **Mobile optimized** - Safe area support for iPhone notch/home indicator
- **Dark mode** - Follows system preference

## Interactive Playground

The [playground](playground.html) provides a visual, interactive explanation of the component's internals:

- **Architecture Overview** - Flow diagram of the rendering pipeline
- **Lit Reactivity System** - `@property` vs `@state` decorators with animated demos
- **Lifecycle Methods** - Interactive timeline of `connectedCallback` → `willUpdate` → `render` → `updated`
- **Rendering Strategies** - Visual comparison of static vs sync (morphing) modes
- **Optimized Morphing** - Element-level hashing visualization with skip/update/add stats
- **Adaptive Throttling** - Live gauge showing morph time budget (target: 25% of interval)
- **Streaming Stats** - Performance metrics simulation (morphs, avg/max times, throttle scaling)
- **Lazy KaTeX** - Before/after comparison of on-demand loading
- **Cache System** - Memory budget allocation visualization (10MB across 5 caches)
- **Cursor Controller** - Blink state machine demo
- **Live Playground** - Real-time markdown rendering and streaming simulation

Supports light/dark themes (auto-detects system preference).

## Usage

```typescript
import './components/markdown-viewer/markdown-viewer';

// In your Lit component
render() {
  return html`
    <markdown-viewer
      .text=${this.markdownContent}
      ?is-streaming=${this.isStreaming}
      throttle-ms="50"
      class=${this.isDark ? 'dark' : ''}
    ></markdown-viewer>
  `;
}
```

## Properties

| Property       | Type      | Default | Description                                 |
| -------------- | --------- | ------- | ------------------------------------------- |
| `text`         | `string`  | `''`    | Markdown source text                        |
| `is-streaming` | `boolean` | `false` | Enable streaming mode (throttling + cursor) |
| `throttle-ms`  | `number`  | `50`    | Minimum ms between updates during streaming |
| `tabindex`     | `string`  | `'0'`   | Auto-set to make component focusable        |

## Methods

| Method                    | Description                                                |
| ------------------------- | ---------------------------------------------------------- |
| `reset()`                 | Clear internal state (call when switching content sources) |
| `static clearAllCaches()` | Clear all global caches (memory management)                |
| `static getCacheStats()`  | Get cache statistics for debugging                         |

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                     markdown-viewer.ts                      │
│                                                             │
│  ┌──────────────┐  ┌───────────┐  ┌───────────────────────┐ │
│  │   Adaptive   │─▶│ Rendering │─▶│  Optimized Morphing   │ │
│  │  Throttling  │  │  Pipeline │  │  (Element-Level Diff) │ │
│  │ (50-200ms)   │  │           │  │  ~99% blocks skipped  │ │
│  └──────┬───────┘  └─────┬─────┘  └───────────┬───────────┘ │
└─────────┼────────────────┼────────────────────┼─────────────┘
          │                │                    │
          ▼                ▼                    ▼
┌─────────────────┐ ┌─────────────┐ ┌──────────────────────────┐
│cursor-controller│ │  parser.ts  │ │        morph.ts          │
│  (blink state)  │ │             │ │                          │
└─────────────────┘ │ ┌─────────┐ │ │ ┌──────────────────────┐ │
                    │ │ Comrak  │ │ │ │ morphContentOptimized│ │
                    │ │ (WASM)  │ │ │ │ - Hash top-level els │ │
                    │ └────┬────┘ │ │ │ - Skip unchanged     │ │
                    │      ▼      │ │ │ - Morph only changed │ │
                    │ ┌─────────┐ │ │ └──────────────────────┘ │
                    │ │  KaTeX  │ │ │ ┌──────────────────────┐ │
                    │ │ (lazy)  │ │ │ │    morphContent      │ │
                    │ └────┬────┘ │ │ │ - Full DOM morph     │ │
                    │      ▼      │ │ │ - Hash-based skip    │ │
                    │ Post-process│ │ └──────────────────────┘ │
                    │ - Code wrap │ └──────────────────────────┘
                    │ - Tables    │
                    │ - Links     │
                    │ - Colors    │
                    └──────┬──────┘
                           ▼
                    ┌─────────────┐
                    │cache-manager│
                    │ (LRU, 10MB) │
                    └─────────────┘
```

## Core Modules

### `parser.ts`

Markdown-to-HTML rendering pipeline:

1. **Comrak** - Rust-based markdown parser (WASM) with GFM extensions
2. **KaTeX** - Math rendering with lazy loading (loads on first math expression)
3. **Post-processing** - Code blocks, tables, links, color previews

```typescript
renderMarkdown(src: string, useSyncStrategy: boolean): string

// KaTeX lazy loading
preloadKaTeX(): Promise<void>  // Warm up cache early
isKaTeXReady(): boolean        // Check if loaded
```

**Bundle Optimization:**

KaTeX is loaded on-demand, saving 77KB (gzip) for pages without math:

```
Main bundle:  430KB gzip (without KaTeX)
KaTeX chunk:   77KB gzip (loaded when needed)
Total:        507KB gzip (only if math used)
```

**Supported Extensions:**

- Strikethrough (`~~text~~`)
- Tables (GFM)
- Autolinks
- Task lists (`- [x] done`)
- Alerts (`> [!NOTE]`, `> [!WARNING]`, etc.)
- Math (`$inline$`, `$$block$$`)
- Footnotes
- Description lists
- Superscript/subscript

### `morph.ts`

Intelligent DOM updates using [Idiomorph](https://github.com/bigskysoftware/idiomorph):

```typescript
// Optimized morph (streaming) - skips unchanged elements
morphContentOptimized(container: Element, newHtml: string): boolean

// Get stats from last optimized morph
getMorphStats(): { updated: number; skipped: number; added: number; removed: number }

// Async morph (batched via RAF) - for non-streaming updates
morphContent(element: Element, newHtml: string): void

// Sync morph (immediate) - for testing/benchmarks
morphContentSync(element: Element, newHtml: string): void

// Reset state
resetMorphCache(): void
resetElementMorphState(): void
```

**Element-Level Optimization:**

During streaming, only the actively changing block needs updating:

```
Update 1: [h1]           → All new
Update 2: [h1][p...]     → h1 skipped (hash match), p morphed
Update 3: [h1][p][ul]    → h1+p skipped, ul added
...
Final:    [148 blocks]   → 147 skipped, 1 updated (~99% skip rate)
```

**Features:**

- Hash-based element comparison (djb2 hash of outerHTML)
- Preserves DOM references for skipped elements (event listeners intact)
- Falls back to full morph for non-streaming updates
- `data-morph-ignore` attribute to protect nodes from removal

### `cache-manager.ts`

Centralized LRU cache with memory budget (~10MB default):

| Cache               | Purpose                    | Budget | Max Entries |
| ------------------- | -------------------------- | ------ | ----------- |
| `renderCacheSync`   | Sync-strategy HTML output  | 25%    | 100         |
| `renderCacheAsync`  | Async-strategy HTML output | 25%    | 100         |
| `katexCacheDisplay` | Block math output          | 25%    | 250         |
| `katexCacheInline`  | Inline math output         | 25%    | 250         |

> Note: Morph state is per-instance via WeakMap (not in shared cache) for multi-viewer isolation.

```typescript
// Access stats
cacheManager.stats;
// → { renderSync, renderAsync, katexDisplay, katexInline, total }

// Manual cleanup
cacheManager.clearAll();
cacheManager.trimIfNeeded(); // Evicts ~25% when >90% budget used
```

### `cursor-controller.ts`

Manages cursor blink animation during streaming:

```typescript
import { createCursorController, type CursorController } from './cursor-controller';

const controller: CursorController = createCursorController({
  blinkEnabled: true,
  blinkSpeed: 1.0, // seconds
  blinkDelay: 1.0, // seconds before blink starts
});

controller.update(container); // Call on each content update
controller.setBlinking(container, true); // Immediate blink (for empty content)
controller.reset(); // Reset blink state
controller.destroy(); // Cleanup
```

**Behavior:**

- Cursor stays solid while receiving updates
- Starts blinking after 500ms idle
- Uses CSS animation toggling to restart blink cycle
- Immediate blinking (no delay) when waiting for content via `setBlinking()`
- Focus-aware styling: solid cursor when focused, hollow frame when unfocused (like terminal emulators)
- Component auto-focuses when streaming starts

## Streaming Optimization

### Adaptive Throttling

Throttle interval automatically adjusts based on morph performance:

```typescript
// Target: morph should take ≤25% of throttle interval
// Range: throttleMs (default 50ms) to 4x throttleMs or 200ms max
// Smoothing: 30% adjustment per update

// Example scaling on slower devices:
// Morph time: 5ms  → Throttle: 50ms  (base)
// Morph time: 15ms → Throttle: 60ms  (ramping up)
// Morph time: 40ms → Throttle: 160ms (under load)
// Morph time: 50ms → Throttle: 200ms (max)
```

### Element-Level Diffing

During streaming, only changed elements are morphed:

```typescript
// morphContentOptimized() algorithm:
// 1. Parse new HTML into temp container
// 2. Hash each top-level element (djb2 of outerHTML)
// 3. Compare with previous frame's hashes
// 4. Skip elements with matching hashes
// 5. Morph only changed elements, append new ones

// Typical streaming stats:
// "🔄 Morph: 1 updated, 147 skipped, 0 added"
// = 99.3% of DOM operations avoided
```

### Rendering Strategy

| Mode           | Morph Function           | Description                                    |
| -------------- | ------------------------ | ---------------------------------------------- |
| Streaming      | `morphContentOptimized`  | Element-level diff, skips unchanged blocks     |
| Post-streaming | `morphContent` (async)   | RAF-batched full morph to prevent jank         |
| Static         | `unsafeHTML`             | Direct render, no morphing                     |

## Autoscroll Utility

Located in `src/utils/animate-scroll.ts`:

```typescript
import {
  animateScrollToBottom,
  cancelScrollAnimation,
  isAtBottom,
} from "./utils/animate-scroll";

// Animated scroll with dynamic target (handles content growth)
animateScrollToBottom(container, {
  dynamicTarget: true,
  afterDelay: 0,
});

// Cancel on user interaction
cancelScrollAnimation(container);

// Check position
if (isAtBottom(container, 50)) {
  // Within 50px of bottom
}
```

**Features:**

- Browser-native easing curve (`cubic-bezier(0.25, 0.1, 0.25, 1.0)`)
- Dynamic target recalculation (handles image loads, etc.)
- Coalesces rapid calls (won't restart if already animating to bottom)
- AbortController-based cancellation

## Styling

### CSS Custom Properties

```css
:host {
  --color-canvas-default: #ffffff;
  --color-canvas-subtle: #f6f8fa;
  --color-border-default: #d0d7de;
  --color-border-muted: hsla(210, 18%, 87%, 1);
  --color-muted-foreground: #656d76;
  --color-muted-bg: rgba(0, 0, 0, 0.05);
  --cursor-color: #f5a1ff;
  --cursor-border-radius: 2px;
}

:host(.dark) {
  --color-canvas-default: #0d1117;
  --color-canvas-subtle: #161b22;
  --color-border-default: #30363d;
  --color-border-muted: #21262d;
  --color-muted-foreground: #8b949e;
  --color-muted-bg: rgba(255, 255, 255, 0.05);
  --cursor-color: #ab65f7;
}
```

### Dark Mode

Add `dark` class to enable dark theme:

```html
<markdown-viewer class="dark" .text="${content}"></markdown-viewer>
```

### Cursor Focus Styling

The cursor changes appearance based on component focus state:

| State     | Cursor Style                    |
| --------- | ------------------------------- |
| Focused   | Solid filled block with glow   |
| Unfocused | Hollow frame (outline only)    |

The component auto-focuses when streaming starts. Click elsewhere or tab away to see the hollow cursor.

## Performance

### Benchmarks (6x CPU throttle, 24KB content, 148 blocks)

| Metric | Value |
|--------|-------|
| Streaming duration | 49.6s |
| Total morphs | 1,793 |
| Average morph time | 12.9ms |
| Element skip rate | **99.3%** |
| Throttle range | 50ms → 200ms (adaptive) |

### Optimization Features

| Feature | Benefit |
|---------|---------|
| Element-level diffing | ~99% of DOM operations skipped |
| Adaptive throttling | Auto-adjusts to device performance |
| KaTeX lazy loading | 77KB saved when no math content |
| LRU caching | Avoids re-parsing identical content |
| Hash-based skip | O(1) change detection |

### Tips

1. **Reuse instances** - Don't recreate the component for each message
2. **Call `reset()`** - When switching content sources to clear stale state
3. **Monitor cache stats** - Use `getCacheStats()` in development
4. **Dev mode logging** - Watch for `🔄 Morph:` stats in console
5. **Throttle appropriately** - 50ms base works well for most LLM streaming rates

## Dependencies

| Package        | Purpose                     |
| -------------- | --------------------------- |
| `lit`          | Web component framework     |
| `@nick/comrak` | Markdown parser (Rust/WASM) |
| `katex`        | Math rendering              |
| `idiomorph`    | DOM morphing                |

## Testing

Run unit tests:

```bash
npm test
```

Run component tests (browser):

```bash
npm run test:component
```

Run all tests:

```bash
npm run test:all
```

Run tests in watch mode:

```bash
npm run test:watch           # Unit tests
npm run test:component:watch # Component tests
```

Run tests with coverage:

```bash
npm run test:coverage            # Unit tests (v8)
npm run test:component:coverage  # Component tests (istanbul)
```

### Test Structure

```
tests/
├── unit/                            # Node environment (188 tests)
│   ├── cache-manager.test.ts        # LRU cache, memory budget, eviction
│   ├── cursor-controller.test.ts    # Cursor blink state tests
│   ├── parser.test.ts               # Markdown rendering tests
│   ├── parser.security.test.ts      # Security/XSS tests (69 tests)
│   ├── animate-scroll.test.ts       # Scroll utility tests
│   └── utils.test.ts                # HTML decode tests
└── component/                       # Browser environment - Playwright (91 tests)
    ├── markdown-viewer.test.ts      # Component rendering, streaming, focus
    ├── morph.test.ts                # DOM morphing, element-level optimization (52 tests)
    └── animate-scroll.test.ts       # Scroll animations, RAF, cancellation
```

**Total: 279 tests** (188 unit + 91 component)

## Security

The markdown parser includes comprehensive XSS protection, particularly important for LLM chat interfaces where untrusted content may be rendered.

### Security Features

- **Raw HTML disabled** - Comrak configured with `unsafe: false`
- **Dangerous tags blocked** - `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, etc.
- **Event handlers stripped** - `onerror`, `onclick`, `onload`, `onmouseover`, etc.
- **Malicious URLs blocked** - `javascript:`, `vbscript:`, dangerous `data:` URIs
- **SVG sanitization** - SVG-based XSS vectors neutralized
- **Style injection blocked** - CSS expressions and `javascript:` in styles
- **External links secured** - Auto-adds `target="_blank" rel="noopener noreferrer"`

### Security Test Coverage (69 tests)

| Category | Tests | Description |
|----------|-------|-------------|
| Script injection | 5 | `<script>` tags, nested scripts |
| Event handlers | 8 | `onerror`, `onclick`, `onload`, etc. |
| JavaScript URLs | 6 | `javascript:`, `vbscript:`, encoded variants |
| Data URIs | 3 | Malicious `data:` URL payloads |
| SVG injection | 4 | SVG `onload`, `<script>`, `foreignObject` |
| Style injection | 3 | CSS expressions, `javascript:` in styles |
| HTML injection | 10 | `<iframe>`, `<object>`, `<form>`, `<meta>`, etc. |
| Prompt injection UI | 6 | Fake system messages, hidden content, RTL |
| Link safety | 5 | External links, special characters, unicode |
| Code blocks | 4 | HTML escaping in code |
| Image safety | 4 | Malformed URLs, event handler injection |
| Math/KaTeX | 3 | Script injection via math |
| Tables | 2 | XSS in table cells |
| Malformed markdown | 4 | Nested structures, parser confusion |
| DoS prevention | 3 | Long input, regex attacks |

## Browser Support

- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

Requires support for:

- Custom Elements v1
- Shadow DOM v1
- ES2020+
- WASM
