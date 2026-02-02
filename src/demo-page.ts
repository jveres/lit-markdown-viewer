import { LitElement, html, css } from "lit";
import { customElement, state, query } from "lit/decorators.js";
import { animate } from "animejs";

import "./components/markdown-viewer/markdown-viewer";
import type { MarkdownViewer } from "./components/markdown-viewer/markdown-viewer";
import { sampleMarkdown } from "./sample-markdown";
import {
  animateScrollToBottom,
  cancelScrollAnimation,
  isAtBottom,
} from "./utils/animate-scroll";

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
    }

    markdown-viewer {
      display: block;
      padding: 1.5rem;
      box-sizing: border-box;
      width: 100%;
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

    :host(.dark) {
      background-color: #0f172a;
    }

    :host(.dark) h1 {
      color: #f1f5f9;
    }

    :host(.dark) .subtitle {
      color: #94a3b8;
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

    :host(.dark) .viewer-container {
      background-color: #1e293b;
      border-color: #334155;
      color: #e2e8f0;
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
  `;

  // ─────────────────────────────────────────────────────────────────────────────
  // Reactive State
  // ─────────────────────────────────────────────────────────────────────────────

  @state() private _text = "";
  @state() private _isStreaming = false;
  @state() private _charCount = 0;
  @state() private _isPaused = false;
  @state() private _speed = "normal";
  @state() private _latency = "heavy";
  @state() private _isDark = false;
  @state() private _autoScrollEnabled = true;
  @state() private _showScrollButton = false;
  @state() private _initialLatencyEnabled = true;
  @state() private _controlsCollapsed = window.innerWidth < 640;

  // ─────────────────────────────────────────────────────────────────────────────
  // Element Queries
  // ─────────────────────────────────────────────────────────────────────────────

  @query("markdown-viewer") private _viewer?: MarkdownViewer;
  @query(".viewer-container") private _viewerContainer?: HTMLDivElement;
  @query(".scroll-to-bottom") private _scrollButton?: HTMLButtonElement;

  // ─────────────────────────────────────────────────────────────────────────────
  // Private State
  // ─────────────────────────────────────────────────────────────────────────────

  private _streamingActive = false;
  private _currentIndex = 0;
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
    if (!this._viewerContainer) return;

    // Scroll event handlers
    this._viewerContainer.addEventListener("wheel", this._handleWheel, {
      passive: true,
    });
    this._viewerContainer.addEventListener(
      "touchstart",
      this._handleTouchStart,
      { passive: true },
    );
    this._viewerContainer.addEventListener("touchmove", this._handleTouchMove, {
      passive: true,
    });
    this._viewerContainer.addEventListener("scroll", this._handleScroll, {
      passive: true,
    });

    // Content resize observer
    const viewer = this._viewerContainer.querySelector("markdown-viewer");
    if (viewer) {
      this._resizeObserver = new ResizeObserver(this._handleContentResize);
      this._resizeObserver.observe(viewer);
      this._lastContentHeight = viewer.scrollHeight;
    }
  }

  override updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has("_showScrollButton")) {
      this._animateScrollButton();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._stopStreaming();

    document.removeEventListener("keydown", this._handleKeyDown);
    this._darkModeQuery.removeEventListener("change", this._handleThemeChange);

    if (this._viewerContainer) {
      this._viewerContainer.removeEventListener("wheel", this._handleWheel);
      this._viewerContainer.removeEventListener(
        "touchstart",
        this._handleTouchStart,
      );
      this._viewerContainer.removeEventListener(
        "touchmove",
        this._handleTouchMove,
      );
      this._viewerContainer.removeEventListener("scroll", this._handleScroll);
    }

    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
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

      // Positive deltaY = finger moving down = scrolling UP
      if (deltaY > 10) {
        this._disableAutoScroll();
      }

      this._lastTouchY = currentY;
    }
  };

  private _handleScroll = (): void => {
    if (!this._viewerContainer) return;

    // Re-enable autoscroll when user reaches bottom (tight threshold)
    if (isAtBottom(this._viewerContainer, 30) && !this._autoScrollEnabled) {
      this._autoScrollEnabled = true;
    }

    this._updateScrollButtonVisibility();
  };

  private _handleContentResize = (entries: ResizeObserverEntry[]): void => {
    if (!this._viewerContainer) return;

    for (const entry of entries) {
      const newHeight = entry.contentRect.height;

      if (
        this._isStreaming &&
        this._autoScrollEnabled &&
        newHeight > this._lastContentHeight
      ) {
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
    if (!this._viewerContainer) return;

    animateScrollToBottom(this._viewerContainer, {
      dynamicTarget: true,
      afterDelay: 0,
    });
  }

  private _disableAutoScroll(): void {
    this._autoScrollEnabled = false;
    if (this._viewerContainer) {
      cancelScrollAnimation(this._viewerContainer);
    }
  }

  private _scrollToBottomAndEnable(): void {
    this._autoScrollEnabled = true;
    this._showScrollButton = false;
    this._scrollToBottom();
  }

  private _updateScrollButtonVisibility(): void {
    if (!this._viewerContainer) return;

    // During streaming: show button when >150px from bottom
    // During normal viewing: show button when >1px from bottom
    const threshold = this._isStreaming ? 150 : 1;
    const atBottom = isAtBottom(this._viewerContainer, threshold);
    const isScrollable =
      this._viewerContainer.scrollHeight > this._viewerContainer.clientHeight;
    const isAutoscrolling = this._isStreaming && this._autoScrollEnabled;

    this._showScrollButton = isScrollable && !atBottom && !isAutoscrolling;
  }

  private _animateScrollButton(): void {
    if (!this._scrollButton) return;

    // Cancel running animation
    this._scrollButtonAnimation?.pause();
    this._scrollButtonAnimation = null;

    if (this._showScrollButton && !this._scrollButtonVisible) {
      // Fly in
      this._scrollButtonVisible = true;
      this._scrollButton.classList.add("visible");
      this._scrollButtonAnimation = animate(this._scrollButton, {
        opacity: [0, 1],
        translateY: ["1rem", "0rem"],
        duration: 250,
        ease: "outCubic",
      });
    } else if (!this._showScrollButton && this._scrollButtonVisible) {
      // Fly out
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
  // Streaming
  // ─────────────────────────────────────────────────────────────────────────────

  private async _startStreaming(): Promise<void> {
    if (this._streamingActive) return;

    // Reset state
    this._viewer?.reset();
    this._text = "";
    this._currentIndex = 0;
    this._charCount = 0;
    this._isStreaming = true;
    this._streamingActive = true;
    this._autoScrollEnabled = true;
    this._lastContentHeight = 0;

    // Initial latency - wait before streaming starts (cursor will blink)
    if (this._initialLatencyEnabled) {
      this._isPaused = true;
      await this._delay(2000);
      this._isPaused = false;
      if (!this._streamingActive) return;
    }

    const [charsPerTick, baseInterval] = this._speedPresets[this._speed];
    const [latencyProb, latencyMin, latencyMax] =
      this._latencyPresets[this._latency];

    while (
      this._streamingActive &&
      this._currentIndex < sampleMarkdown.length
    ) {
      // Simulate network latency
      if (latencyProb > 0 && Math.random() < latencyProb) {
        const latencyMs =
          latencyMin + Math.random() * (latencyMax - latencyMin);
        this._isPaused = true;
        await this._delay(latencyMs);
        this._isPaused = false;
        if (!this._streamingActive) break;
      }

      // Add next chunk
      const endIndex = Math.min(
        this._currentIndex + charsPerTick,
        sampleMarkdown.length,
      );
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

  private _delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UI Event Handlers
  // ─────────────────────────────────────────────────────────────────────────────

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
    const progress =
      sampleMarkdown.length > 0
        ? Math.round((this._charCount / sampleMarkdown.length) * 100)
        : 0;

    return html`
      <div class="container">
        <header>
          <h1>Markdown Viewer Demo</h1>
          <p class="subtitle">
            Lit Web Component port of the typefm Svelte 5 markdown viewer
          </p>
        </header>

        <div class="controls ${this._controlsCollapsed ? 'collapsed' : ''}">
          <div class="controls-header" @click=${this._toggleControls}>
            <span>Controls</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </div>
          <div class="controls-content">
            <div class="controls-row">
              <button
                class="btn-primary"
                @click=${this._startStreaming}
                ?disabled=${this._isStreaming}
              >
                Start Streaming
              </button>
              <button
                class="btn-secondary"
                @click=${this._stopStreaming}
                ?disabled=${!this._isStreaming}
              >
                Stop
              </button>
              <button
                class="btn-secondary"
                @click=${this._loadInstant}
                ?disabled=${this._isStreaming}
              >
                Load Instant
              </button>
              <button
                class="btn-danger"
                @click=${this._clear}
                ?disabled=${this._isStreaming}
              >
                Clear
              </button>
            </div>

            <div class="controls-row">
              <div class="speed-control">
                <label for="speed">Speed:</label>
                <select
                  id="speed"
                  @change=${this._handleSpeedChange}
                  ?disabled=${this._isStreaming}
                >
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
                <select
                  id="latency"
                  @change=${this._handleLatencyChange}
                  ?disabled=${this._isStreaming}
                >
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
                <label for="initial-latency">Initial latency (2s)</label>
              </div>
            </div>
          </div>
        </div>

        <div class="status-bar">
          <div class="status-item">
            <span class="status-label">Status:</span>
            <span
              class="status-value ${this._isPaused
                ? "paused"
                : this._isStreaming
                  ? "streaming"
                  : "idle"}"
            >
              ${streamingStatus}
            </span>
          </div>
          <div class="status-item">
            <span class="status-label">Characters:</span>
            <span class="status-value"
              >${this._charCount.toLocaleString()}</span
            >
          </div>
          <div class="status-item">
            <span class="status-label">Progress:</span>
            <span class="status-value">${progress}%</span>
          </div>
        </div>

        <div class="viewer-wrapper">
          <div class="viewer-container">
            <markdown-viewer
              .text=${this._text}
              ?is-streaming=${this._isStreaming}
              throttle-ms="50"
              class=${this._isDark ? "dark" : ""}
            ></markdown-viewer>
          </div>
          <button
            class="scroll-to-bottom"
            @click=${this._scrollToBottomAndEnable}
            title="Scroll to bottom"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
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
