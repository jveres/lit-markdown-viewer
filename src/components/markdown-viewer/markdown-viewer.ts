import { LitElement, html, unsafeCSS, type PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import { CURSOR_MARKER, renderMarkdown } from './parser';
import { morphContent, morphContentSync, resetMorphCache } from './morph';
import { createCursorController, type CursorController } from './cursor-controller';
import { cacheManager } from './cache-manager';
import { createPerfLogger } from '../../utils/perf';

const perf = createPerfLogger('markdown');

// Import styles
import viewerStyles from './styles/viewer.css?raw';
import alertsStyles from './styles/alerts.css?raw';
import katexStyles from './styles/katex.css?raw';

// Import KaTeX CSS from package
import katexCss from 'katex/dist/katex.min.css?raw';

@customElement('markdown-viewer')
export class MarkdownViewer extends LitElement {
  static override styles = [
    unsafeCSS(katexCss),
    unsafeCSS(viewerStyles),
    unsafeCSS(alertsStyles),
    unsafeCSS(katexStyles)
  ];

  // ---------------------------------------------------------
  // Properties
  // ---------------------------------------------------------

  @property({ type: String })
  text = '';

  @property({ type: Boolean, attribute: 'is-streaming' })
  isStreaming = false;

  @property({ type: Number, attribute: 'throttle-ms' })
  throttleMs = 50;

  // ---------------------------------------------------------
  // Internal State
  // ---------------------------------------------------------

  @state()
  private _throttledText = '';

  @state()
  private _hasStreamed = false;

  @query('.markdown')
  private _containerRef?: HTMLDivElement;

  // Throttling state
  private _lastThrottleTime = 0;
  private _rafScheduled = false;

  // Memoization cache for rendered content
  private _lastSource = '';
  private _lastStrategy = false;
  private _lastStreaming = false;
  private _lastResult = '';

  // Cursor controller for blink state management
  private _cursorController: CursorController | null = null;

  // ---------------------------------------------------------
  // Computed Properties
  // ---------------------------------------------------------

  private get _useSyncStrategy(): boolean {
    return this.isStreaming || this._hasStreamed;
  }

  private get _renderedContent(): string {
    const baseText = this.isStreaming ? this._throttledText : this.text;
    const source = this.isStreaming ? baseText + CURSOR_MARKER : baseText;
    if (!source) return '';

    // Skip re-render if base text, strategy, and streaming state unchanged
    if (
      baseText === this._lastSource &&
      this._useSyncStrategy === this._lastStrategy &&
      this.isStreaming === this._lastStreaming
    ) {
      return this._lastResult;
    }

    this._lastSource = baseText;
    this._lastStrategy = this._useSyncStrategy;
    this._lastStreaming = this.isStreaming;
    this._lastResult = perf.measure('parse', () => renderMarkdown(source, this._useSyncStrategy), 5);
    return this._lastResult;
  }

  // ---------------------------------------------------------
  // Lifecycle Methods
  // ---------------------------------------------------------

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('click', this._handleClick);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('click', this._handleClick);
    this._rafScheduled = false;
    this._cursorController?.destroy();
    this._cursorController = null;
  }

  override willUpdate(changedProperties: PropertyValues): void {
    // Latch streaming state
    if (changedProperties.has('isStreaming') && this.isStreaming) {
      this._hasStreamed = true;
    }

    // Handle throttling when text or streaming state changes
    if (changedProperties.has('text') || changedProperties.has('isStreaming')) {
      this._updateThrottledText();
    }
  }

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    // Apply DOM morphing for sync strategy
    if (this._useSyncStrategy && this._containerRef) {
      if (this.isStreaming) {
        // Use sync morph during streaming so cursor is immediately available
        perf.measure('morph', () => morphContentSync(this._containerRef!, this._renderedContent), 5);

        // Initialize cursor controller if not yet created
        if (!this._cursorController) {
          this._cursorController = createCursorController();
        }

        // Update cursor state AFTER morph (so the cursor element exists)
        this._cursorController.update(this._containerRef);
      } else {
        // Use async morph (RAF) for non-streaming updates to prevent jank
        morphContent(this._containerRef, this._renderedContent);
      }
    }
  }

  // ---------------------------------------------------------
  // Throttling Implementation (RAF-based)
  // ---------------------------------------------------------

  private _updateThrottledText(): void {
    // If not streaming, update immediately
    if (!this.isStreaming) {
      this._throttledText = this.text;
      this._rafScheduled = false;
      return;
    }

    const now = Date.now();

    // If enough time has passed, update immediately
    if (now - this._lastThrottleTime >= this.throttleMs) {
      this._throttledText = this.text;
      this._lastThrottleTime = now;
    } else if (!this._rafScheduled) {
      // Schedule a frame-aligned update
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

  // ---------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------

  private _handleClick = (event: Event): void => {
    // Use composedPath to get the actual target inside shadow DOM
    const path = event.composedPath();
    const target = path[0] as HTMLElement;
    
    // Check if click is on copy button or its children
    const copyBtn = target.closest('.copy-btn') as HTMLButtonElement | null;
    if (!copyBtn) return;

    // Find the code element (sibling pre > code)
    const wrapper = copyBtn.closest('.code-block-wrapper');
    const codeElement = wrapper?.querySelector('pre code');
    if (!codeElement) return;

    // Get text content (strips HTML tags)
    const code = codeElement.textContent ?? '';

    // Copy to clipboard
    navigator.clipboard.writeText(code).then(() => {
      // Show success feedback
      copyBtn.classList.add('copied');
      
      // Reset after delay
      setTimeout(() => {
        copyBtn.classList.remove('copied');
      }, 2000);
    }).catch((err) => {
      console.error('Failed to copy code:', err);
    });
  };

  // ---------------------------------------------------------
  // Public Methods
  // ---------------------------------------------------------

  /**
   * Reset the component state (useful when switching content sources)
   */
  reset(): void {
    this._hasStreamed = false;
    this._throttledText = '';
    this._lastSource = '';
    this._lastStrategy = false;
    this._lastStreaming = false;
    this._lastResult = '';
    resetMorphCache();
    this._cursorController?.reset();
  }

  /**
   * Clear all caches (useful for memory management)
   */
  static clearAllCaches(): void {
    cacheManager.clearAll();
  }

  /**
   * Get cache statistics for debugging/monitoring
   */
  static getCacheStats() {
    return cacheManager.stats;
  }

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------

  override render() {
    /*
     * If `_useSyncStrategy` is TRUE (Streaming or Finished Streaming):
     * We use DOM morphing via `morphContent`. This patches the DOM intelligently.
     * It prevents full re-renders and preserves selection.
     * The content is rendered empty initially and morphed in updated().
     *
     * If `_useSyncStrategy` is FALSE (Initial Static Load):
     * We use standard unsafeHTML for speed.
     */
    if (this._useSyncStrategy) {
      return html`<div class="markdown"></div>`;
    } else {
      return html`<div class="markdown">${unsafeHTML(this._renderedContent)}</div>`;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'markdown-viewer': MarkdownViewer;
  }
}
