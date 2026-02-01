# Markdown Viewer

A high-performance Lit Web Component for rendering markdown with streaming support, optimized for LLM chat interfaces.

## Features

- **Streaming Support** - Optimized for real-time content updates with throttling and DOM morphing
- **Syntax Highlighting** - Code blocks with language detection and copy button
- **Math Rendering** - KaTeX support for inline (`$...$`) and block (`$$...$$`) math
- **GitHub Flavored Markdown** - Tables, task lists, strikethrough, alerts, footnotes
- **Smart Caching** - LRU caches for rendered content, KaTeX output, and DOM state
- **Cursor Animation** - Blinking cursor during streaming with idle detection
- **Dark Mode** - Full dark theme support via CSS class

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

## Methods

| Method                    | Description                                                |
| ------------------------- | ---------------------------------------------------------- |
| `reset()`                 | Clear internal state (call when switching content sources) |
| `static clearAllCaches()` | Clear all global caches (memory management)                |
| `static getCacheStats()`  | Get cache statistics for debugging                         |

## Architecture

```text
┌───────────────────────────────────────────────────────┐
│                  markdown-viewer.ts                   │
│                                                       │
│  ┌───────────┐  ┌───────────┐  ┌───────────────────┐  │
│  │ Throttling│─▶│ Rendering │─▶│   DOM Morphing    │  │
│  │(RAF-based)│  │  Pipeline │  │   (Idiomorph)     │  │
│  └─────┬─────┘  └─────┬─────┘  └─────────┬─────────┘  │
└────────┼──────────────┼──────────────────┼────────────┘
         │              │                  │
         ▼              ▼                  ▼
┌─────────────────┐ ┌─────────────┐ ┌────────────────────┐
│cursor-controller│ │  parser.ts  │ │     morph.ts       │
│  (blink state)  │ │             │ │                    │
└─────────────────┘ │ ┌─────────┐ │ │ - Sync (streaming) │
                    │ │ Comrak  │ │ │ - Async (RAF)      │
                    │ └────┬────┘ │ │ - Hash-based skip  │
                    │      ▼      │ └────────────────────┘
                    │ ┌─────────┐ │
                    │ │  KaTeX  │ │
                    │ └────┬────┘ │
                    │      ▼      │
                    │ Post-process│
                    │ - Code wrap │
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
2. **KaTeX** - Math rendering with display/inline modes
3. **Post-processing** - Code blocks, tables, links, color previews

```typescript
renderMarkdown(src: string, useSyncStrategy: boolean): string
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
// Async (batched via RAF) - for non-streaming updates
morphContent(element: Element, newHtml: string): void

// Sync (immediate) - for streaming updates
morphContentSync(element: Element, newHtml: string): void

// Reset state
resetMorphCache(): void
```

**Features:**

- Hash-based change detection (skips identical content)
- Preserves text selection during updates
- `data-morph-ignore` attribute to protect nodes from removal

### `cache-manager.ts`

Centralized LRU cache with memory budget (~10MB default):

| Cache               | Purpose                    | Budget |
| ------------------- | -------------------------- | ------ |
| `renderCacheSync`   | Sync-strategy HTML output  | 25%    |
| `renderCacheAsync`  | Async-strategy HTML output | 25%    |
| `katexCacheDisplay` | Block math output          | 20%    |
| `katexCacheInline`  | Inline math output         | 20%    |
| `morphCache`        | DOM state hashes           | 10%    |

```typescript
// Access stats
cacheManager.stats;

// Manual cleanup
cacheManager.clearAll();
cacheManager.trimIfNeeded();
```

### `cursor-controller.ts`

Manages cursor blink animation during streaming:

```typescript
const controller = createCursorController({
  blinkEnabled: true,
  blinkSpeed: 1.0, // seconds
  blinkDelay: 1.0, // seconds before blink starts
});

controller.update(container); // Call on each content update
controller.reset(); // Reset blink state
controller.destroy(); // Cleanup
```

**Behavior:**

- Cursor stays solid while receiving updates
- Starts blinking after 500ms idle
- Uses CSS animation toggling to restart blink cycle

## Streaming Optimization

### Throttling (RAF-based)

Updates are throttled using `requestAnimationFrame`:

```typescript
// In markdown-viewer.ts
private _updateThrottledText(): void {
  if (!this.isStreaming) {
    this._throttledText = this.text;
    return;
  }

  const now = Date.now();
  if (now - this._lastThrottleTime >= this.throttleMs) {
    this._throttledText = this.text;
    this._lastThrottleTime = now;
  } else if (!this._rafScheduled) {
    this._rafScheduled = true;
    requestAnimationFrame(() => {
      if (this._rafScheduled && this.isStreaming) {
        this._throttledText = this.text;
        this._lastThrottleTime = Date.now();
      }
      this._rafScheduled = false;
    });
  }
}
```

### Rendering Strategy

| Mode           | Morph | Description                                 |
| -------------- | ----- | ------------------------------------------- |
| Streaming      | Sync  | Immediate DOM updates for cursor visibility |
| Post-streaming | Async | RAF-batched updates to prevent jank         |
| Static         | None  | Direct `unsafeHTML` render                  |

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

## Performance Tips

1. **Reuse instances** - Don't recreate the component for each message
2. **Call `reset()`** - When switching content sources to clear stale state
3. **Monitor cache stats** - Use `getCacheStats()` in development
4. **Throttle appropriately** - 50ms works well for most LLM streaming rates

## Dependencies

| Package        | Purpose                     |
| -------------- | --------------------------- |
| `lit`          | Web component framework     |
| `@nick/comrak` | Markdown parser (Rust/WASM) |
| `katex`        | Math rendering              |
| `idiomorph`    | DOM morphing                |

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
