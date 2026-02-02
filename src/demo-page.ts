import { LitElement, html, css } from "lit";
import { customElement, state, query } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { animate } from "animejs";

import "./components/markdown-viewer/markdown-viewer";
import type { MarkdownViewer } from "./components/markdown-viewer/markdown-viewer";
import { sampleMarkdown } from "./sample-markdown";
import {
  animateScrollToBottom,
  cancelScrollAnimation,
  isAtBottom,
} from "./utils/animate-scroll";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Scenario = "streaming" | "chat";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sample Chat Data
// ─────────────────────────────────────────────────────────────────────────────

const SAMPLE_USER_MESSAGES = [
  "What is TypeScript and why should I use it?",
  "Can you show me an example of TypeScript interfaces?",
  "How do generics work in TypeScript?",
  "What's the difference between `type` and `interface`?",
  "Explain TypeScript decorators",
  "How do I handle null and undefined in TypeScript?",
  "What are mapped types?",
  "Can you explain conditional types?",
  "How do I migrate a JavaScript project to TypeScript?",
  "What are some TypeScript best practices?",
  "How does type inference work?",
  "What is the `unknown` type?",
  "Explain discriminated unions",
  "How do I type React components with TypeScript?",
  "What are template literal types?",
  "How do I use TypeScript with Node.js?",
  "What is `satisfies` keyword?",
  "How do I create type guards?",
  "What are utility types in TypeScript?",
  "How do I handle async/await with proper types?",
  "What is declaration merging?",
  "How do I type third-party libraries without types?",
  "Explain the `infer` keyword",
  "What are const assertions?",
  "How do I set up a TypeScript monorepo?",
];

const SAMPLE_ASSISTANT_RESPONSES = [
  `**TypeScript** is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.

## Key Benefits

1. **Type Safety** - Catch errors at compile time rather than runtime
2. **Better IDE Support** - Autocompletion, refactoring, and inline documentation
3. **Self-Documenting Code** - Types serve as documentation
4. **Easier Refactoring** - The compiler catches breaking changes

\`\`\`typescript
// Example: Type safety in action
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

greet("World"); // ✅ OK
greet(42);      // ❌ Error: Argument of type 'number' is not assignable
\`\`\``,

  `Here's an example of TypeScript interfaces:

\`\`\`typescript
interface User {
  id: number;
  name: string;
  email: string;
  age?: number; // Optional property
  readonly createdAt: Date; // Read-only property
}

interface Admin extends User {
  permissions: string[];
}

const user: User = {
  id: 1,
  name: "John Doe",
  email: "john@example.com",
  createdAt: new Date()
};
\`\`\`

Interfaces can also describe function types:

\`\`\`typescript
interface SearchFunc {
  (source: string, subString: string): boolean;
}

const mySearch: SearchFunc = (src, sub) => src.includes(sub);
\`\`\``,

  `## Generics in TypeScript

Generics allow you to write reusable, type-safe code:

\`\`\`typescript
// Generic function
function identity<T>(arg: T): T {
  return arg;
}

// Usage - type is inferred
const num = identity(42);      // num: number
const str = identity("hello"); // str: string

// Generic interface
interface Box<T> {
  value: T;
  getValue(): T;
}

// Generic class
class Container<T> {
  private items: T[] = [];
  
  add(item: T): void {
    this.items.push(item);
  }
  
  get(index: number): T {
    return this.items[index];
  }
}

// Generic constraints
function getLength<T extends { length: number }>(arg: T): number {
  return arg.length;
}
\`\`\``,

  `## \`type\` vs \`interface\`

| Feature | \`interface\` | \`type\` |
|---------|-------------|---------|
| Extend/Inherit | ✅ \`extends\` | ✅ \`&\` intersection |
| Declaration merging | ✅ Yes | ❌ No |
| Computed properties | ❌ No | ✅ Yes |
| Union types | ❌ No | ✅ Yes |
| Mapped types | ❌ No | ✅ Yes |

\`\`\`typescript
// Interface - can be extended and merged
interface Animal {
  name: string;
}
interface Animal {
  age: number; // Declaration merging
}

// Type - more flexible
type ID = string | number; // Union
type Point = { x: number; y: number };
type Coordinate = Point & { z: number }; // Intersection
\`\`\`

**Rule of thumb:** Use \`interface\` for object shapes, \`type\` for everything else.`,

  `## TypeScript Decorators

Decorators are special declarations that can modify classes, methods, or properties:

\`\`\`typescript
// Method decorator
function log(target: any, key: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;
  descriptor.value = function(...args: any[]) {
    console.log(\`Calling \${key} with:\`, args);
    return original.apply(this, args);
  };
}

// Class decorator
function sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

@sealed
class Calculator {
  @log
  add(a: number, b: number): number {
    return a + b;
  }
}
\`\`\`

> **Note:** Enable \`experimentalDecorators\` in tsconfig.json`,

  `## Handling \`null\` and \`undefined\`

TypeScript provides several ways to handle nullable values:

\`\`\`typescript
// Strict null checks (enable in tsconfig)
let name: string | null = null;

// Optional chaining
const length = name?.length; // number | undefined

// Nullish coalescing
const displayName = name ?? "Anonymous";

// Non-null assertion (use carefully!)
const definitelyName = name!; // Asserts non-null

// Type guard
function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

if (isNotNull(name)) {
  console.log(name.toUpperCase()); // name is string here
}
\`\`\``,

  `## Mapped Types

Mapped types transform existing types:

\`\`\`typescript
// Built-in mapped types
type Partial<T> = { [P in keyof T]?: T[P] };
type Required<T> = { [P in keyof T]-?: T[P] };
type Readonly<T> = { readonly [P in keyof T]: T[P] };

// Custom mapped type
type Nullable<T> = { [P in keyof T]: T[P] | null };

interface User {
  name: string;
  age: number;
}

type NullableUser = Nullable<User>;
// { name: string | null; age: number | null }

// Key remapping (TS 4.1+)
type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<string & K>}\`]: () => T[K]
};
\`\`\``,

  `## Conditional Types

Conditional types select types based on conditions:

\`\`\`typescript
// Basic syntax: T extends U ? X : Y
type IsString<T> = T extends string ? true : false;

type A = IsString<string>;  // true
type B = IsString<number>;  // false

// Extract and Exclude
type Extract<T, U> = T extends U ? T : never;
type Exclude<T, U> = T extends U ? never : T;

type T1 = Extract<"a" | "b" | "c", "a" | "f">;  // "a"
type T2 = Exclude<"a" | "b" | "c", "a">;        // "b" | "c"

// Distributive conditional types
type ToArray<T> = T extends any ? T[] : never;
type StrOrNumArray = ToArray<string | number>; // string[] | number[]
\`\`\``,

  `## Migrating JavaScript to TypeScript

### Step-by-step approach:

1. **Add TypeScript to your project**
\`\`\`bash
npm install typescript --save-dev
npx tsc --init
\`\`\`

2. **Start with loose settings in tsconfig.json**
\`\`\`json
{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": false,
    "strict": false,
    "noImplicitAny": false
  }
}
\`\`\`

3. **Rename files gradually**: \`.js\` → \`.ts\`

4. **Add types incrementally**
   - Start with \`any\` where needed
   - Replace \`any\` with proper types over time

5. **Enable strict mode gradually**
\`\`\`json
{
  "strict": true // Enable when ready
}
\`\`\``,

  `## TypeScript Best Practices

### Do ✅
- Enable \`strict\` mode
- Use \`unknown\` instead of \`any\`
- Prefer interfaces for public APIs
- Use \`readonly\` for immutable data
- Let TypeScript infer when possible

### Don't ❌
- Overuse \`any\`
- Use \`// @ts-ignore\` without good reason
- Export mutable objects
- Ignore compiler warnings

\`\`\`typescript
// ✅ Good
function process(data: unknown): string {
  if (typeof data === "string") {
    return data.toUpperCase();
  }
  throw new Error("Expected string");
}

// ❌ Avoid
function process(data: any): any {
  return data.toUpperCase(); // No type safety
}
\`\`\``,
];

function generateChatMessages(count: number): ChatMessage[] {
  const messages: ChatMessage[] = [];
  const pairs = Math.floor(count / 2);
  
  for (let i = 0; i < pairs; i++) {
    messages.push({
      id: i * 2,
      role: "user",
      content: SAMPLE_USER_MESSAGES[i % SAMPLE_USER_MESSAGES.length],
    });
    messages.push({
      id: i * 2 + 1,
      role: "assistant",
      content: SAMPLE_ASSISTANT_RESPONSES[i % SAMPLE_ASSISTANT_RESPONSES.length],
    });
  }
  
  return messages;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

@customElement("demo-page")
export class DemoPage extends LitElement {
  static override styles = css`
    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      background-color: #f8fafc;
      font-family:
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Roboto,
        sans-serif;
    }

    .container {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      min-width: 0;
      max-width: 900px;
      width: 100%;
      margin: 0 auto;
      padding: 1rem;
      padding-top: calc(1rem + env(safe-area-inset-top));
      padding-bottom: calc(0.5rem + env(safe-area-inset-bottom));
      padding-left: calc(1rem + env(safe-area-inset-left));
      padding-right: calc(1rem + env(safe-area-inset-right));
    }

    @media (min-width: 640px) {
      .container {
        padding: 2rem;
      }
    }

    header {
      margin-bottom: 1rem;
    }

    h1 {
      margin: 0 0 0.5rem 0;
      font-size: 1.75rem;
      font-weight: 600;
      color: #1e293b;
    }

    .subtitle {
      color: #64748b;
      font-size: 0.875rem;
    }

    /* Scenario Selector */
    .scenario-selector {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .scenario-selector label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #64748b;
    }

    .scenario-selector select {
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      background-color: #ffffff;
      color: #1e293b;
      cursor: pointer;
      min-width: 200px;
    }

    .scenario-selector select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .controls {
      margin-bottom: 1rem;
      background-color: #ffffff;
      border-radius: 0.5rem;
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }

    .controls-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      cursor: pointer;
      user-select: none;
      font-size: 0.875rem;
      font-weight: 500;
      color: #64748b;
    }

    .controls-header:hover {
      background-color: #f8fafc;
    }

    .controls-header svg {
      width: 1rem;
      height: 1rem;
      transition: transform 0.2s ease;
    }

    .controls.collapsed .controls-header svg {
      transform: rotate(-90deg);
    }

    .controls-content {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 0 1rem 1rem;
    }

    .controls.collapsed .controls-content {
      display: none;
    }

    .controls-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: center;
    }

    @media (min-width: 640px) {
      .controls-header {
        display: none;
      }

      .controls-content {
        padding: 1rem;
      }

      .controls.collapsed .controls-content {
        display: flex;
      }
    }

    button {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      border: none;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background-color: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #2563eb;
    }

    .btn-secondary {
      background-color: #6b7280;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background-color: #4b5563;
    }

    .btn-danger {
      background-color: #ef4444;
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background-color: #dc2626;
    }

    .speed-control {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .speed-control label {
      font-size: 0.875rem;
      color: #64748b;
    }

    .speed-control select {
      padding: 0.375rem 0.5rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      background-color: white;
    }

    .checkbox-control {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .checkbox-control label {
      font-size: 0.875rem;
      color: #64748b;
      cursor: pointer;
    }

    .checkbox-control input[type="checkbox"] {
      width: 1rem;
      height: 1rem;
      cursor: pointer;
    }

    .status-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1rem;
      padding: 0.75rem 1rem;
      background-color: #ffffff;
      border-radius: 0.5rem;
      border: 1px solid #e2e8f0;
      font-size: 0.875rem;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .status-label {
      color: #64748b;
    }

    .status-value {
      font-weight: 500;
      color: #1e293b;
    }

    .status-value.streaming {
      color: #10b981;
    }

    .status-value.paused {
      color: #f59e0b;
    }

    .status-value.idle {
      color: #6b7280;
    }

    .viewer-wrapper {
      position: relative;
      flex: 1;
      min-height: 0;
      min-width: 0;
      width: 100%;
      display: flex;
      flex-direction: column;
    }

    .viewer-container {
      flex: 1;
      min-height: 0;
      width: 100%;
      background-color: #ffffff;
      border-radius: 0.5rem;
      border: 1px solid #e2e8f0;
      overflow: auto;

      /* Minimal scrollbar */
      isolation: isolate;
      scrollbar-color: #d0d7de transparent;
      scrollbar-gutter: stable;
      scrollbar-width: thin;
      will-change: scroll-position;
    }

    .viewer-container markdown-viewer {
      display: block;
      padding: 1.5rem;
      box-sizing: border-box;
      width: 100%;
    }

    /* Chat Styles */
    .chat-container {
      flex: 1;
      min-height: 0;
      width: 100%;
      background-color: #ffffff;
      border-radius: 0.5rem;
      border: 1px solid #e2e8f0;
      overflow: auto;
      padding: 1rem;

      /* Minimal scrollbar */
      isolation: isolate;
      scrollbar-color: #d0d7de transparent;
      scrollbar-gutter: stable;
      scrollbar-width: thin;
      will-change: scroll-position;
    }

    .chat-messages {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .chat-message {
      display: flex;
      gap: 0.75rem;
      max-width: 85%;
    }

    .chat-message.user {
      align-self: flex-end;
      flex-direction: row-reverse;
    }

    .chat-message.assistant {
      align-self: flex-start;
    }

    .chat-avatar {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .chat-message.user .chat-avatar {
      background-color: #3b82f6;
      color: white;
    }

    .chat-message.assistant .chat-avatar {
      background-color: #10b981;
      color: white;
    }

    .chat-bubble {
      border-radius: 1rem;
      overflow: hidden;
    }

    .chat-message.user .chat-bubble {
      background-color: #3b82f6;
      color: white;
      border-bottom-right-radius: 0.25rem;
    }

    .chat-message.user .chat-bubble markdown-viewer {
      --color-canvas-default: transparent;
      --color-fg-default: white;
      color: white;
    }

    .chat-message.assistant .chat-bubble {
      background-color: #f1f5f9;
      border-bottom-left-radius: 0.25rem;
    }

    .chat-bubble markdown-viewer {
      display: block;
      padding: 0.75rem 1rem;
    }

    .scroll-to-bottom {
      position: absolute;
      bottom: 1rem;
      right: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      padding: 0;
      background-color: #3b82f6;
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transition: background-color 0.15s ease;
      z-index: 10;
      opacity: 0;
      transform: translateY(1rem);
      pointer-events: none;
    }

    .scroll-to-bottom.visible {
      pointer-events: auto;
    }

    .scroll-to-bottom:hover {
      background-color: #2563eb;
    }

    .scroll-to-bottom svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    /* Dark Mode */
    :host(.dark) {
      background-color: #0f172a;
    }

    :host(.dark) h1 {
      color: #f1f5f9;
    }

    :host(.dark) .subtitle {
      color: #94a3b8;
    }

    :host(.dark) .scenario-selector label {
      color: #94a3b8;
    }

    :host(.dark) .scenario-selector select {
      background-color: #334155;
      border-color: #475569;
      color: #f1f5f9;
    }

    :host(.dark) .controls,
    :host(.dark) .status-bar {
      background-color: #1e293b;
      border-color: #334155;
    }

    :host(.dark) .controls-header {
      color: #94a3b8;
    }

    :host(.dark) .controls-header:hover {
      background-color: #334155;
    }

    :host(.dark) .viewer-container,
    :host(.dark) .chat-container {
      background-color: #1e293b;
      border-color: #334155;
      color: #e2e8f0;
      scrollbar-color: #475569 transparent;
    }

    :host(.dark) .status-label,
    :host(.dark) .speed-control label {
      color: #94a3b8;
    }

    :host(.dark) .status-value {
      color: #f1f5f9;
    }

    :host(.dark) .speed-control select {
      background-color: #334155;
      border-color: #475569;
      color: #f1f5f9;
    }

    :host(.dark) .checkbox-control label {
      color: #94a3b8;
    }

    :host(.dark) .scroll-to-bottom {
      background-color: #6366f1;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    :host(.dark) .scroll-to-bottom:hover {
      background-color: #4f46e5;
    }

    :host(.dark) .chat-message.assistant .chat-bubble {
      background-color: #334155;
    }
  `;

  // ─────────────────────────────────────────────────────────────────────────────
  // Reactive State
  // ─────────────────────────────────────────────────────────────────────────────

  @state() private _scenario: Scenario = "streaming";
  @state() private _text = sampleMarkdown;
  @state() private _isStreaming = false;
  @state() private _charCount = sampleMarkdown.length;
  @state() private _isPaused = false;
  @state() private _speed = "normal";
  @state() private _latency = "heavy";
  @state() private _isDark = false;
  @state() private _autoScrollEnabled = true;
  @state() private _showScrollButton = false;
  @state() private _initialLatencyEnabled = true;
  @state() private _controlsCollapsed = window.innerWidth < 640;
  
  // Chat scenario state
  @state() private _chatMessages: ChatMessage[] = [];
  @state() private _streamingMessageId: number | null = null;
  @state() private _streamingContent = "";

  // ─────────────────────────────────────────────────────────────────────────────
  // Element Queries
  // ─────────────────────────────────────────────────────────────────────────────

  @query("markdown-viewer") private _viewer?: MarkdownViewer;
  @query(".viewer-container") private _viewerContainer?: HTMLDivElement;
  @query(".chat-container") private _chatContainer?: HTMLDivElement;
  @query(".scroll-to-bottom") private _scrollButton?: HTMLButtonElement;

  // ─────────────────────────────────────────────────────────────────────────────
  // Private State
  // ─────────────────────────────────────────────────────────────────────────────

  private _streamingActive = false;
  private _currentIndex = sampleMarkdown.length;
  private _lastContentHeight = 0;
  private _lastTouchY = 0;
  private _scrollButtonVisible = false;
  private _scrollButtonAnimation: ReturnType<typeof animate> | null = null;
  private _resizeObserver: ResizeObserver | null = null;

  // ─────────────────────────────────────────────────────────────────────────────
  // Presets
  // ─────────────────────────────────────────────────────────────────────────────

  // Speed presets: [charsPerTick, baseIntervalMs]
  private readonly _speedPresets: Record<string, [number, number]> = {
    "ultra-slow": [1, 150],
    "very-slow": [1, 80],
    slow: [2, 60],
    normal: [4, 40],
    fast: [10, 30],
    "very-fast": [25, 20],
  };

  // Latency presets: [probability, minMs, maxMs]
  private readonly _latencyPresets: Record<string, [number, number, number]> = {
    none: [0, 0, 0],
    light: [0.05, 200, 500],
    medium: [0.08, 300, 1500],
    heavy: [0.12, 500, 3000],
    extreme: [0.15, 1000, 5000],
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Theme
  // ─────────────────────────────────────────────────────────────────────────────

  private _darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");

  private _handleThemeChange = (e: MediaQueryListEvent) => {
    this._isDark = e.matches;
    this.classList.toggle("dark", e.matches);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────────────────────────────────────

  override connectedCallback(): void {
    super.connectedCallback();

    // Initialize theme
    this._isDark = this._darkModeQuery.matches;
    this.classList.toggle("dark", this._isDark);
    this._darkModeQuery.addEventListener("change", this._handleThemeChange);

    // Global keyboard handler
    document.addEventListener("keydown", this._handleKeyDown);
  }

  override firstUpdated(): void {
    this._setupScrollHandlers();
  }

  override updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has("_showScrollButton")) {
      this._animateScrollButton();
    }
    if (changedProperties.has("_scenario")) {
      // Re-setup scroll handlers when scenario changes
      this._setupScrollHandlers();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._stopStreaming();

    document.removeEventListener("keydown", this._handleKeyDown);
    this._darkModeQuery.removeEventListener("change", this._handleThemeChange);

    this._cleanupScrollHandlers();
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
  }

  private _setupScrollHandlers(): void {
    // Cleanup previous handlers
    this._cleanupScrollHandlers();
    
    const container = this._getActiveContainer();
    if (!container) return;

    container.addEventListener("wheel", this._handleWheel, { passive: true });
    container.addEventListener("touchstart", this._handleTouchStart, { passive: true });
    container.addEventListener("touchmove", this._handleTouchMove, { passive: true });
    container.addEventListener("scroll", this._handleScroll, { passive: true });

    // Content resize observer
    this._resizeObserver = new ResizeObserver(this._handleContentResize);
    this._resizeObserver.observe(container);
    this._lastContentHeight = container.scrollHeight;
  }

  private _cleanupScrollHandlers(): void {
    const containers = [this._viewerContainer, this._chatContainer];
    for (const container of containers) {
      if (container) {
        container.removeEventListener("wheel", this._handleWheel);
        container.removeEventListener("touchstart", this._handleTouchStart);
        container.removeEventListener("touchmove", this._handleTouchMove);
        container.removeEventListener("scroll", this._handleScroll);
      }
    }
    this._resizeObserver?.disconnect();
  }

  private _getActiveContainer(): HTMLDivElement | undefined {
    return this._scenario === "streaming" ? this._viewerContainer : this._chatContainer;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Event Handlers (arrow functions for stable references)
  // ─────────────────────────────────────────────────────────────────────────────

  private _handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === "Escape" && this._isStreaming) {
      this._stopStreaming();
    } else if (["PageUp", "ArrowUp", "Home"].includes(e.key)) {
      this._disableAutoScroll();
    }
  };

  private _handleWheel = (e: WheelEvent): void => {
    if (e.deltaY < 0) {
      this._disableAutoScroll();
    }
  };

  private _handleTouchStart = (e: TouchEvent): void => {
    if (e.touches.length > 0) {
      this._lastTouchY = e.touches[0].clientY;
    }
  };

  private _handleTouchMove = (e: TouchEvent): void => {
    if (e.touches.length > 0) {
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - this._lastTouchY;

      if (deltaY > 10) {
        this._disableAutoScroll();
      }

      this._lastTouchY = currentY;
    }
  };

  private _handleScroll = (): void => {
    const container = this._getActiveContainer();
    if (!container) return;

    if (isAtBottom(container, 30) && !this._autoScrollEnabled) {
      this._autoScrollEnabled = true;
    }

    this._updateScrollButtonVisibility();
  };

  private _handleContentResize = (entries: ResizeObserverEntry[]): void => {
    const container = this._getActiveContainer();
    if (!container) return;

    for (const entry of entries) {
      const newHeight = entry.contentRect.height;

      if (this._isStreaming && this._autoScrollEnabled && newHeight > this._lastContentHeight) {
        this._scrollToBottom();
      }

      this._lastContentHeight = newHeight;
    }

    this._updateScrollButtonVisibility();
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Autoscroll
  // ─────────────────────────────────────────────────────────────────────────────

  private _scrollToBottom(): void {
    const container = this._getActiveContainer();
    if (!container) return;

    animateScrollToBottom(container, {
      dynamicTarget: true,
      afterDelay: 0,
    });
  }

  private _disableAutoScroll(): void {
    this._autoScrollEnabled = false;
    const container = this._getActiveContainer();
    if (container) {
      cancelScrollAnimation(container);
    }
  }

  private _scrollToBottomAndEnable(): void {
    this._autoScrollEnabled = true;
    this._showScrollButton = false;
    this._scrollToBottom();
  }

  private _updateScrollButtonVisibility(): void {
    const container = this._getActiveContainer();
    if (!container) return;

    const threshold = this._isStreaming ? 150 : 1;
    const atBottom = isAtBottom(container, threshold);
    const isScrollable = container.scrollHeight > container.clientHeight;
    const isAutoscrolling = this._isStreaming && this._autoScrollEnabled;

    this._showScrollButton = isScrollable && !atBottom && !isAutoscrolling;
  }

  private _animateScrollButton(): void {
    if (!this._scrollButton) return;

    this._scrollButtonAnimation?.pause();
    this._scrollButtonAnimation = null;

    if (this._showScrollButton && !this._scrollButtonVisible) {
      this._scrollButtonVisible = true;
      this._scrollButton.classList.add("visible");
      this._scrollButtonAnimation = animate(this._scrollButton, {
        opacity: [0, 1],
        translateY: ["1rem", "0rem"],
        duration: 250,
        ease: "outCubic",
      });
    } else if (!this._showScrollButton && this._scrollButtonVisible) {
      this._scrollButtonAnimation = animate(this._scrollButton, {
        opacity: [1, 0],
        translateY: ["0rem", "1rem"],
        duration: 200,
        ease: "inCubic",
        onComplete: () => {
          this._scrollButtonVisible = false;
          this._scrollButton?.classList.remove("visible");
        },
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Scenario Switching
  // ─────────────────────────────────────────────────────────────────────────────

  private _switchScenario(scenario: Scenario): void {
    if (this._scenario === scenario) return;
    
    this._stopStreaming();
    this._scenario = scenario;
    this._showScrollButton = false;
    this._autoScrollEnabled = true;
    
    if (scenario === "chat") {
      this._chatMessages = [];
      this._streamingMessageId = null;
      this._streamingContent = "";
    } else {
      this._text = sampleMarkdown;
      this._charCount = sampleMarkdown.length;
      this._currentIndex = sampleMarkdown.length;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Streaming (Single Viewer Scenario)
  // ─────────────────────────────────────────────────────────────────────────────

  private async _startStreaming(): Promise<void> {
    if (this._streamingActive) return;

    this._viewer?.reset();
    this._text = "";
    this._currentIndex = 0;
    this._charCount = 0;
    this._isStreaming = true;
    this._streamingActive = true;
    this._autoScrollEnabled = true;
    this._lastContentHeight = 0;

    if (this._initialLatencyEnabled) {
      this._isPaused = true;
      await this._delay(2000);
      this._isPaused = false;
      if (!this._streamingActive) return;
    }

    const [charsPerTick, baseInterval] = this._speedPresets[this._speed];
    const [latencyProb, latencyMin, latencyMax] = this._latencyPresets[this._latency];

    while (this._streamingActive && this._currentIndex < sampleMarkdown.length) {
      if (latencyProb > 0 && Math.random() < latencyProb) {
        const latencyMs = latencyMin + Math.random() * (latencyMax - latencyMin);
        this._isPaused = true;
        await this._delay(latencyMs);
        this._isPaused = false;
        if (!this._streamingActive) break;
      }

      const endIndex = Math.min(this._currentIndex + charsPerTick, sampleMarkdown.length);
      this._text = sampleMarkdown.slice(0, endIndex);
      this._charCount = endIndex;
      this._currentIndex = endIndex;

      if (this._autoScrollEnabled) {
        this._scrollToBottom();
      }

      await this._delay(baseInterval);
    }

    this._stopStreaming();
  }

  private _stopStreaming(): void {
    this._streamingActive = false;
    this._isStreaming = false;
    this._isPaused = false;
    this._streamingMessageId = null;
  }

  private _loadInstant(): void {
    this._stopStreaming();
    this._viewer?.reset();
    this._text = sampleMarkdown;
    this._charCount = sampleMarkdown.length;
    this._currentIndex = sampleMarkdown.length;
  }

  private _clear(): void {
    this._stopStreaming();
    this._viewer?.reset();
    this._text = "";
    this._charCount = 0;
    this._currentIndex = 0;
    this._lastContentHeight = 0;
    this._showScrollButton = false;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Chat Scenario
  // ─────────────────────────────────────────────────────────────────────────────

  private async _startChatSimulation(): Promise<void> {
    if (this._streamingActive) return;

    this._chatMessages = [];
    this._streamingActive = true;
    this._isStreaming = true;
    this._autoScrollEnabled = true;
    this._charCount = 0;

    const allMessages = generateChatMessages(50);
    const [charsPerTick, baseInterval] = this._speedPresets[this._speed];
    const [latencyProb, latencyMin, latencyMax] = this._latencyPresets[this._latency];

    for (const message of allMessages) {
      if (!this._streamingActive) break;

      if (message.role === "user") {
        // User messages appear instantly
        this._chatMessages = [...this._chatMessages, message];
        this._charCount += message.content.length;
        await this._delay(300);
      } else {
        // Assistant messages stream character by character
        this._streamingMessageId = message.id;
        this._streamingContent = "";
        this._chatMessages = [...this._chatMessages, { ...message, content: "" }];

        // Initial latency before assistant starts responding
        if (this._initialLatencyEnabled) {
          this._isPaused = true;
          await this._delay(1000 + Math.random() * 1000);
          this._isPaused = false;
          if (!this._streamingActive) break;
        }

        let currentIndex = 0;
        while (this._streamingActive && currentIndex < message.content.length) {
          // Simulate network latency
          if (latencyProb > 0 && Math.random() < latencyProb) {
            const latencyMs = latencyMin + Math.random() * (latencyMax - latencyMin);
            this._isPaused = true;
            await this._delay(latencyMs);
            this._isPaused = false;
            if (!this._streamingActive) break;
          }

          const endIndex = Math.min(currentIndex + charsPerTick, message.content.length);
          this._streamingContent = message.content.slice(0, endIndex);
          
          // Update the message in the array
          this._chatMessages = this._chatMessages.map(m =>
            m.id === message.id ? { ...m, content: this._streamingContent } : m
          );
          
          this._charCount += endIndex - currentIndex;
          currentIndex = endIndex;

          if (this._autoScrollEnabled) {
            this._scrollToBottom();
          }

          await this._delay(baseInterval);
        }

        this._streamingMessageId = null;
        await this._delay(500);
      }
    }

    this._stopStreaming();
  }

  private _loadChatInstant(): void {
    this._stopStreaming();
    this._chatMessages = generateChatMessages(50);
    this._charCount = this._chatMessages.reduce((sum, m) => sum + m.content.length, 0);
    this._streamingMessageId = null;
  }

  private _clearChat(): void {
    this._stopStreaming();
    this._chatMessages = [];
    this._charCount = 0;
    this._streamingMessageId = null;
    this._showScrollButton = false;
  }

  private _delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UI Event Handlers
  // ─────────────────────────────────────────────────────────────────────────────

  private _handleScenarioChange(e: Event): void {
    const scenario = (e.target as HTMLSelectElement).value as Scenario;
    this._switchScenario(scenario);
  }

  private _handleSpeedChange(e: Event): void {
    this._speed = (e.target as HTMLSelectElement).value;
  }

  private _handleLatencyChange(e: Event): void {
    this._latency = (e.target as HTMLSelectElement).value;
  }

  private _handleInitialLatencyChange(e: Event): void {
    this._initialLatencyEnabled = (e.target as HTMLInputElement).checked;
  }

  private _toggleControls(): void {
    this._controlsCollapsed = !this._controlsCollapsed;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  override render() {
    const streamingStatus = this._isPaused
      ? "Paused (latency)"
      : this._isStreaming
        ? "Streaming..."
        : "Idle";

    return html`
      <div class="container">
        <header>
          <h1>Markdown Viewer Demo</h1>
          <p class="subtitle">
            Lit Web Component for rendering markdown with streaming support
          </p>
        </header>

        <div class="scenario-selector">
          <label for="scenario">Scenario:</label>
          <select
            id="scenario"
            @change=${this._handleScenarioChange}
            ?disabled=${this._isStreaming}
          >
            <option value="streaming" ?selected=${this._scenario === 'streaming'}>
              📄 Single Document Streaming
            </option>
            <option value="chat" ?selected=${this._scenario === 'chat'}>
              💬 AI Chat (50 messages)
            </option>
          </select>
        </div>

        ${this._scenario === 'streaming' ? this._renderStreamingControls() : this._renderChatControls()}

        <div class="status-bar">
          <div class="status-item">
            <span class="status-label">Status:</span>
            <span class="status-value ${this._isPaused ? 'paused' : this._isStreaming ? 'streaming' : 'idle'}">
              ${streamingStatus}
            </span>
          </div>
          <div class="status-item">
            <span class="status-label">Characters:</span>
            <span class="status-value">${this._charCount.toLocaleString()}</span>
          </div>
          ${this._scenario === 'chat' ? html`
            <div class="status-item">
              <span class="status-label">Messages:</span>
              <span class="status-value">${this._chatMessages.length}</span>
            </div>
          ` : html`
            <div class="status-item">
              <span class="status-label">Progress:</span>
              <span class="status-value">${Math.round((this._charCount / sampleMarkdown.length) * 100)}%</span>
            </div>
          `}
        </div>

        <div class="viewer-wrapper">
          ${this._scenario === 'streaming' ? this._renderStreamingViewer() : this._renderChatViewer()}
          <button
            class="scroll-to-bottom"
            @click=${this._scrollToBottomAndEnable}
            title="Scroll to bottom"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  private _renderStreamingControls() {
    return html`
      <div class="controls ${this._controlsCollapsed ? 'collapsed' : ''}">
        <div class="controls-header" @click=${this._toggleControls}>
          <span>Controls</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </div>
        <div class="controls-content">
          <div class="controls-row">
            <button class="btn-primary" @click=${this._startStreaming} ?disabled=${this._isStreaming}>
              Start Streaming
            </button>
            <button class="btn-secondary" @click=${this._stopStreaming} ?disabled=${!this._isStreaming}>
              Stop
            </button>
            <button class="btn-secondary" @click=${this._loadInstant} ?disabled=${this._isStreaming}>
              Load Instant
            </button>
            <button class="btn-danger" @click=${this._clear} ?disabled=${this._isStreaming}>
              Clear
            </button>
          </div>
          ${this._renderCommonControls()}
        </div>
      </div>
    `;
  }

  private _renderChatControls() {
    return html`
      <div class="controls ${this._controlsCollapsed ? 'collapsed' : ''}">
        <div class="controls-header" @click=${this._toggleControls}>
          <span>Controls</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </div>
        <div class="controls-content">
          <div class="controls-row">
            <button class="btn-primary" @click=${this._startChatSimulation} ?disabled=${this._isStreaming}>
              Start Chat
            </button>
            <button class="btn-secondary" @click=${this._stopStreaming} ?disabled=${!this._isStreaming}>
              Stop
            </button>
            <button class="btn-secondary" @click=${this._loadChatInstant} ?disabled=${this._isStreaming}>
              Load All
            </button>
            <button class="btn-danger" @click=${this._clearChat} ?disabled=${this._isStreaming}>
              Clear
            </button>
          </div>
          ${this._renderCommonControls()}
        </div>
      </div>
    `;
  }

  private _renderCommonControls() {
    return html`
      <div class="controls-row">
        <div class="speed-control">
          <label for="speed">Speed:</label>
          <select id="speed" @change=${this._handleSpeedChange} ?disabled=${this._isStreaming}>
            <option value="ultra-slow">Ultra Slow</option>
            <option value="very-slow">Very Slow</option>
            <option value="slow">Slow</option>
            <option value="normal" selected>Normal</option>
            <option value="fast">Fast</option>
            <option value="very-fast">Very Fast</option>
          </select>
        </div>
        <div class="speed-control">
          <label for="latency">Latency:</label>
          <select id="latency" @change=${this._handleLatencyChange} ?disabled=${this._isStreaming}>
            <option value="none">None</option>
            <option value="light">Light</option>
            <option value="medium">Medium</option>
            <option value="heavy" selected>Heavy</option>
            <option value="extreme">Extreme</option>
          </select>
        </div>
        <div class="checkbox-control">
          <input
            type="checkbox"
            id="initial-latency"
            ?checked=${this._initialLatencyEnabled}
            @change=${this._handleInitialLatencyChange}
            ?disabled=${this._isStreaming}
          />
          <label for="initial-latency">Initial latency</label>
        </div>
      </div>
    `;
  }

  private _renderStreamingViewer() {
    return html`
      <div class="viewer-container">
        <markdown-viewer
          .text=${this._text}
          ?is-streaming=${this._isStreaming}
          throttle-ms="50"
          class=${this._isDark ? "dark" : ""}
        ></markdown-viewer>
      </div>
    `;
  }

  private _renderChatViewer() {
    return html`
      <div class="chat-container">
        <div class="chat-messages">
          ${repeat(
            this._chatMessages,
            (msg) => msg.id,
            (msg) => html`
              <div class="chat-message ${msg.role}">
                <div class="chat-avatar">
                  ${msg.role === 'user' ? 'U' : 'AI'}
                </div>
                <div class="chat-bubble">
                  <markdown-viewer
                    .text=${msg.content}
                    ?is-streaming=${this._streamingMessageId === msg.id}
                    throttle-ms="50"
                    class=${this._isDark ? "dark" : ""}
                  ></markdown-viewer>
                </div>
              </div>
            `
          )}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "demo-page": DemoPage;
  }
}
