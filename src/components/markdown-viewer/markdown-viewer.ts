import { LitElement, html, unsafeCSS, type PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import { CURSOR_MARKER, renderMarkdown, preloadKaTeX, isKaTeXReady } from './parser';
import { morphContent, morphContentOptimized, getMorphStats, resetMorphCache } from './morph';
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
  
  // Adaptive throttling state
  private _adaptiveThrottleMs = 0; // 0 = use throttleMs property
  private _lastMorphDuration = 0;
  
  // Streaming stats
  private _streamingStats = {
    morphCount: 0,
    morphTotalMs: 0,
    morphMinMs: Infinity,
    morphMaxMs: 0,
    throttleMaxMs: 0,
    startTime: 0
  };

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

    // Make component focusable for cursor styling
    if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '0');
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('click', this._handleClick);
    this._rafScheduled = false;
    this._cursorController?.destroy();
    this._cursorController = null;
  }

  override willUpdate(changedProperties: PropertyValues): void {
    // Latch streaming state and focus when streaming starts
    if (changedProperties.has('isStreaming')) {
      if (this.isStreaming) {
        this._hasStreamed = true;
        this._resetStreamingStats();
        this.focus();
      } else if (changedProperties.get('isStreaming') === true) {
        // Streaming just ended
        this._logStreamingStats();
      }
    }

    // Ensure KaTeX is loaded when content changes (handles both streaming and static)
    if (changedProperties.has('text') && this.text) {
      this._ensureKaTeXLoaded();
    }

    // Handle throttling when text or streaming state changes
    if (changedProperties.has('text') || changedProperties.has('isStreaming')) {
      this._updateThrottledText();
    }
  }

  /**
   * Ensure KaTeX is loaded, trigger re-render when ready
   */
  private _ensureKaTeXLoaded(): void {
    if (isKaTeXReady()) return;
    
    preloadKaTeX().then(() => {
      // Clear memoization cache to force re-render with KaTeX
      this._lastSource = '';
      this._lastResult = '';
      // Clear global render cache too (may have placeholders cached)
      cacheManager.renderCacheSync.clear();
      cacheManager.renderCacheAsync.clear();
      // Trigger update if we have content
      if (this.text) {
        this.requestUpdate();
      }
    });
  }

  override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    // Apply DOM morphing for sync strategy
    if (this._useSyncStrategy && this._containerRef) {
      if (this.isStreaming) {
        // Use optimized morph during streaming - skips unchanged elements
        // Track duration for adaptive throttling and stats
        const startTime = performance.now();
        perf.measure('morph', () => morphContentOptimized(this._containerRef!, this._renderedContent), 5);
        this._lastMorphDuration = performance.now() - startTime;
        this._adjustAdaptiveThrottle();
        this._trackMorphStats();
        
        // Log morph stats in dev mode
        if (import.meta.env.DEV) {
          const stats = getMorphStats();
          if (stats.skipped > 0) {
            console.log(`🔄 Morph: ${stats.updated} updated, ${stats.skipped} skipped, ${stats.added} added`);
          }
        }

        // Initialize cursor controller if not yet created
        if (!this._cursorController) {
          this._cursorController = createCursorController();
        }

        // Update cursor state AFTER morph (so the cursor element exists)
        // When text is empty, start blinking immediately (waiting state)
        // Otherwise use normal update flow (solid while typing, blink after idle)
        if (!this._throttledText) {
          this._cursorController.setBlinking(this._containerRef, true);
        } else {
          this._cursorController.update(this._containerRef);
        }
      } else {
        // Use async morph (RAF) for non-streaming updates to prevent jank
        morphContent(this._containerRef, this._renderedContent);
      }
    }
  }

  // ---------------------------------------------------------
  // Adaptive Throttling
  // ---------------------------------------------------------

  private _adjustAdaptiveThrottle(): void {
    const baseThrottle = this.throttleMs;
    const morphTime = this._lastMorphDuration;
    
    // Target: morph should take at most 25% of the throttle interval
    // This leaves 75% for browser paint, GC, layout, and other work
    // More aggressive than 50% to kick in earlier and keep UI smooth
    const targetMorphBudget = 0.25;
    
    // Calculate ideal throttle based on last morph time
    const idealThrottle = morphTime / targetMorphBudget;
    
    // Smoothly adjust (don't jump instantly)
    // Move 30% toward ideal each update
    const smoothingFactor = 0.3;
    const currentThrottle = this._adaptiveThrottleMs || baseThrottle;
    const newThrottle = currentThrottle + (idealThrottle - currentThrottle) * smoothingFactor;
    
    // Clamp to reasonable bounds
    const minThrottle = baseThrottle; // Never go below user-specified throttle
    const maxThrottle = Math.max(baseThrottle * 4, 200); // Max 4x base or 200ms
    
    this._adaptiveThrottleMs = Math.max(minThrottle, Math.min(maxThrottle, newThrottle));
  }

  private get _effectiveThrottleMs(): number {
    return this._adaptiveThrottleMs || this.throttleMs;
  }

  // ---------------------------------------------------------
  // Streaming Stats
  // ---------------------------------------------------------

  private _resetStreamingStats(): void {
    this._streamingStats = {
      morphCount: 0,
      morphTotalMs: 0,
      morphMinMs: Infinity,
      morphMaxMs: 0,
      throttleMaxMs: 0,
      startTime: performance.now()
    };
  }

  private _trackMorphStats(): void {
    const morphTime = this._lastMorphDuration;
    // Skip hash-skip morphs (< 2ms) for meaningful stats
    if (morphTime < 2) return;
    
    const stats = this._streamingStats;
    stats.morphCount++;
    stats.morphTotalMs += morphTime;
    stats.morphMinMs = Math.min(stats.morphMinMs, morphTime);
    stats.morphMaxMs = Math.max(stats.morphMaxMs, morphTime);
    stats.throttleMaxMs = Math.max(stats.throttleMaxMs, this._adaptiveThrottleMs);
  }

  private _logStreamingStats(): void {
    // Only log in development mode
    if (import.meta.env?.PROD) return;
    
    const stats = this._streamingStats;
    if (stats.morphCount === 0) return;
    
    const duration = performance.now() - stats.startTime;
    const avgMorph = stats.morphTotalMs / stats.morphCount;
    
    console.log(
      `📊 Streaming complete:\n` +
      `   Duration: ${(duration / 1000).toFixed(2)}s\n` +
      `   Morphs: ${stats.morphCount} (avg ${avgMorph.toFixed(1)}ms, min ${stats.morphMinMs.toFixed(1)}ms, max ${stats.morphMaxMs.toFixed(1)}ms)\n` +
      `   Throttle: base ${this.throttleMs}ms → max ${stats.throttleMaxMs.toFixed(1)}ms\n` +
      `   Content: ${(this.text.length / 1024).toFixed(1)}KB`
    );
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
    const effectiveThrottle = this._effectiveThrottleMs;

    // If enough time has passed, update immediately
    if (now - this._lastThrottleTime >= effectiveThrottle) {
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
    this._adaptiveThrottleMs = 0;
    this._lastMorphDuration = 0;
    this._resetStreamingStats();
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
