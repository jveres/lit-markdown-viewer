import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { animate } from "animejs";

import "./components/markdown-viewer/markdown-viewer";
import type { MarkdownViewer } from "./components/markdown-viewer/markdown-viewer";
import {
  animateScrollToBottom,
  cancelScrollAnimation,
  isAtBottom,
} from "./utils/animate-scroll";

// Scenario imports
import {
  // Streaming scenario
  getInitialStreamingState,
  getEmptyStreamingState,
  getFullStreamingState,
  getSampleMarkdown,
  renderStreamingControls,
  renderStreamingViewer,
  renderStreamingStatus,
  // Chat scenario
  generateChatMessages,
  getInitialChatState,
  getEmptyChatState,
  renderChatControls,
  renderChatViewer,
  renderChatStatus,
} from "./scenarios";
import type { ChatMessage } from "./scenarios";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Scenario = "streaming" | "chat";

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
  @state() private _isStreaming = false;
  @state() private _isPaused = false;
  @state() private _speed = "normal";
  @state() private _latency = "heavy";
  @state() private _isDark = false;
  @state() private _autoScrollEnabled = true;
  @state() private _showScrollButton = false;
  @state() private _initialLatencyEnabled = true;
  @state() private _controlsCollapsed = window.innerWidth < 640;
  
  // Streaming scenario state
  @state() private _text = getSampleMarkdown();
  @state() private _charCount = getSampleMarkdown().length;
  private _currentIndex = getSampleMarkdown().length;
  
  // Chat scenario state
  @state() private _chatMessages: ChatMessage[] = [];
  @state() private _streamingMessageId: number | null = null;
  private _streamingContent = "";

  // ─────────────────────────────────────────────────────────────────────────────
  // Private State
  // ─────────────────────────────────────────────────────────────────────────────

  private _streamingActive = false;
  private _lastContentHeight = 0;
  private _lastTouchY = 0;
  private _scrollButtonVisible = false;
  private _scrollButtonAnimation: ReturnType<typeof animate> | null = null;
  private _resizeObserver: ResizeObserver | null = null;

  // ─────────────────────────────────────────────────────────────────────────────
  // Presets
  // ─────────────────────────────────────────────────────────────────────────────

  private readonly _speedPresets: Record<string, [number, number]> = {
    "ultra-slow": [1, 150],
    "very-slow": [1, 80],
    slow: [2, 60],
    normal: [4, 40],
    fast: [10, 30],
    "very-fast": [25, 20],
  };

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
    this._isDark = this._darkModeQuery.matches;
    this.classList.toggle("dark", this._isDark);
    this._darkModeQuery.addEventListener("change", this._handleThemeChange);
    document.addEventListener("keydown", this._handleKeyDown);
  }

  override firstUpdated(): void {
    this._setupScrollHandlers();
  }

  override async updated(changedProperties: Map<string, unknown>): Promise<void> {
    if (changedProperties.has("_showScrollButton")) {
      this._animateScrollButton();
    }
    if (changedProperties.has("_scenario")) {
      await this.updateComplete;
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
    this._cleanupScrollHandlers();
    
    const container = this._getActiveContainer();
    if (!container) return;

    container.addEventListener("wheel", this._handleWheel, { passive: true });
    container.addEventListener("touchstart", this._handleTouchStart, { passive: true });
    container.addEventListener("touchmove", this._handleTouchMove, { passive: true });
    container.addEventListener("scroll", this._handleScroll, { passive: true });

    this._resizeObserver = new ResizeObserver(this._handleContentResize);
    this._resizeObserver.observe(container);
    this._lastContentHeight = container.scrollHeight;
  }

  private _cleanupScrollHandlers(): void {
    const selectors = [".viewer-container", ".chat-container"];
    for (const selector of selectors) {
      const container = this.shadowRoot?.querySelector(selector) as HTMLElement | null;
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
    const selector = this._scenario === "streaming" ? ".viewer-container" : ".chat-container";
    return this.shadowRoot?.querySelector(selector) as HTMLDivElement | undefined;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Event Handlers
  // ─────────────────────────────────────────────────────────────────────────────

  private _handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === "Escape" && this._isStreaming) {
      this._stopStreaming();
    } else if (["PageUp", "ArrowUp", "Home"].includes(e.key)) {
      this._disableAutoScroll();
    }
  };

  private _handleWheel = (e: WheelEvent): void => {
    if (e.deltaY < 0) this._disableAutoScroll();
  };

  private _handleTouchStart = (e: TouchEvent): void => {
    if (e.touches.length > 0) this._lastTouchY = e.touches[0].clientY;
  };

  private _handleTouchMove = (e: TouchEvent): void => {
    if (e.touches.length > 0) {
      const deltaY = e.touches[0].clientY - this._lastTouchY;
      if (deltaY > 10) this._disableAutoScroll();
      this._lastTouchY = e.touches[0].clientY;
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
    if (container) {
      animateScrollToBottom(container, { dynamicTarget: true, afterDelay: 0 });
    }
  }

  private _disableAutoScroll(): void {
    this._autoScrollEnabled = false;
    const container = this._getActiveContainer();
    if (container) cancelScrollAnimation(container);
  }

  private _scrollToBottomAndEnable = (): void => {
    this._autoScrollEnabled = true;
    this._showScrollButton = false;
    this._scrollToBottom();
  };

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
    const button = this.shadowRoot?.querySelector(".scroll-to-bottom") as HTMLButtonElement | null;
    if (!button) return;

    this._scrollButtonAnimation?.pause();
    this._scrollButtonAnimation = null;

    if (this._showScrollButton && !this._scrollButtonVisible) {
      this._scrollButtonVisible = true;
      button.classList.add("visible");
      this._scrollButtonAnimation = animate(button, {
        opacity: [0, 1],
        translateY: ["1rem", "0rem"],
        duration: 250,
        ease: "outCubic",
      });
    } else if (!this._showScrollButton && this._scrollButtonVisible) {
      this._scrollButtonAnimation = animate(button, {
        opacity: [1, 0],
        translateY: ["0rem", "1rem"],
        duration: 200,
        ease: "inCubic",
        onComplete: () => {
          this._scrollButtonVisible = false;
          button.classList.remove("visible");
        },
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Scenario Switching
  // ─────────────────────────────────────────────────────────────────────────────

  private _handleScenarioChange = (e: Event): void => {
    this._switchScenario((e.target as HTMLSelectElement).value as Scenario);
  };

  private _switchScenario(scenario: Scenario): void {
    if (this._scenario === scenario) return;
    
    this._stopStreaming();
    this._scenario = scenario;
    this._showScrollButton = false;
    this._autoScrollEnabled = true;
    
    if (scenario === "chat") {
      const state = getInitialChatState();
      this._chatMessages = state.messages;
      this._charCount = state.charCount;
      this._streamingMessageId = null;
      this._streamingContent = "";
    } else {
      const state = getInitialStreamingState();
      this._text = state.text;
      this._charCount = state.charCount;
      this._currentIndex = state.currentIndex;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Streaming Scenario Methods
  // ─────────────────────────────────────────────────────────────────────────────

  private _startStreaming = async (): Promise<void> => {
    if (this._streamingActive) return;

    const viewer = this.shadowRoot?.querySelector("markdown-viewer") as MarkdownViewer | null;
    viewer?.reset();
    
    const state = getEmptyStreamingState();
    this._text = state.text;
    this._charCount = state.charCount;
    this._currentIndex = state.currentIndex;
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

    const sampleMarkdown = getSampleMarkdown();
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

      if (this._autoScrollEnabled) this._scrollToBottom();
      await this._delay(baseInterval);
    }

    this._stopStreaming();
  };

  private _loadInstant = (): void => {
    this._stopStreaming();
    const viewer = this.shadowRoot?.querySelector("markdown-viewer") as MarkdownViewer | null;
    viewer?.reset();
    const state = getFullStreamingState();
    this._text = state.text;
    this._charCount = state.charCount;
    this._currentIndex = state.currentIndex;
  };

  private _clearStreaming = (): void => {
    this._stopStreaming();
    const viewer = this.shadowRoot?.querySelector("markdown-viewer") as MarkdownViewer | null;
    viewer?.reset();
    const state = getEmptyStreamingState();
    this._text = state.text;
    this._charCount = state.charCount;
    this._currentIndex = state.currentIndex;
    this._lastContentHeight = 0;
    this._showScrollButton = false;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Chat Scenario Methods
  // ─────────────────────────────────────────────────────────────────────────────

  private _startChatSimulation = async (): Promise<void> => {
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
        this._chatMessages = [...this._chatMessages, message];
        this._charCount += message.content.length;
        await this._delay(300);
      } else {
        this._streamingMessageId = message.id;
        this._streamingContent = "";
        this._chatMessages = [...this._chatMessages, { ...message, content: "" }];

        if (this._initialLatencyEnabled) {
          this._isPaused = true;
          await this._delay(1000 + Math.random() * 1000);
          this._isPaused = false;
          if (!this._streamingActive) break;
        }

        let currentIndex = 0;
        while (this._streamingActive && currentIndex < message.content.length) {
          if (latencyProb > 0 && Math.random() < latencyProb) {
            const latencyMs = latencyMin + Math.random() * (latencyMax - latencyMin);
            this._isPaused = true;
            await this._delay(latencyMs);
            this._isPaused = false;
            if (!this._streamingActive) break;
          }

          const endIndex = Math.min(currentIndex + charsPerTick, message.content.length);
          this._streamingContent = message.content.slice(0, endIndex);
          
          this._chatMessages = this._chatMessages.map(m =>
            m.id === message.id ? { ...m, content: this._streamingContent } : m
          );
          
          this._charCount += endIndex - currentIndex;
          currentIndex = endIndex;

          if (this._autoScrollEnabled) this._scrollToBottom();
          await this._delay(baseInterval);
        }

        this._streamingMessageId = null;
        await this._delay(500);
      }
    }

    this._stopStreaming();
  };

  private _reloadChat = (): void => {
    this._stopStreaming();
    const state = getInitialChatState();
    this._chatMessages = state.messages;
    this._charCount = state.charCount;
    this._streamingMessageId = null;
  };

  private _clearChat = (): void => {
    this._stopStreaming();
    const state = getEmptyChatState();
    this._chatMessages = state.messages;
    this._charCount = state.charCount;
    this._streamingMessageId = null;
    this._showScrollButton = false;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Common Methods
  // ─────────────────────────────────────────────────────────────────────────────

  private _stopStreaming = (): void => {
    this._streamingActive = false;
    this._isStreaming = false;
    this._isPaused = false;
    this._streamingMessageId = null;
  };

  private _delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private _handleSpeedChange = (e: Event): void => {
    this._speed = (e.target as HTMLSelectElement).value;
  };

  private _handleLatencyChange = (e: Event): void => {
    this._latency = (e.target as HTMLSelectElement).value;
  };

  private _handleInitialLatencyChange = (e: Event): void => {
    this._initialLatencyEnabled = (e.target as HTMLInputElement).checked;
  };

  private _toggleControls = (): void => {
    this._controlsCollapsed = !this._controlsCollapsed;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

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
          <select id="scenario" @change=${this._handleScenarioChange} ?disabled=${this._isStreaming}>
            <option value="streaming" ?selected=${this._scenario === 'streaming'}>
              📄 Single Document Streaming
            </option>
            <option value="chat" ?selected=${this._scenario === 'chat'}>
              💬 AI Chat (50 messages)
            </option>
          </select>
        </div>

        ${this._scenario === 'streaming' 
          ? renderStreamingControls({
              isStreaming: this._isStreaming,
              controlsCollapsed: this._controlsCollapsed,
              onStart: this._startStreaming,
              onStop: this._stopStreaming,
              onLoadInstant: this._loadInstant,
              onClear: this._clearStreaming,
              onToggleControls: this._toggleControls,
              commonControls: this._renderCommonControls(),
            })
          : renderChatControls({
              isStreaming: this._isStreaming,
              controlsCollapsed: this._controlsCollapsed,
              onStart: this._startChatSimulation,
              onStop: this._stopStreaming,
              onReload: this._reloadChat,
              onClear: this._clearChat,
              onToggleControls: this._toggleControls,
              commonControls: this._renderCommonControls(),
            })
        }

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
          ${this._scenario === 'chat' 
            ? renderChatStatus({ messageCount: this._chatMessages.length })
            : renderStreamingStatus({ charCount: this._charCount, totalChars: getSampleMarkdown().length })
          }
        </div>

        <div class="viewer-wrapper">
          ${this._scenario === 'streaming'
            ? renderStreamingViewer({
                text: this._text,
                isStreaming: this._isStreaming,
                isDark: this._isDark,
              })
            : renderChatViewer({
                messages: this._chatMessages,
                streamingMessageId: this._streamingMessageId,
                isDark: this._isDark,
              })
          }
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
}

declare global {
  interface HTMLElementTagNameMap {
    "demo-page": DemoPage;
  }
}
