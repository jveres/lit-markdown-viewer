// ─────────────────────────────────────────────────────────────────────────────
// Streaming Scenario - Single Document Streaming Demo
// ─────────────────────────────────────────────────────────────────────────────

import { html } from "lit";
import type { TemplateResult } from "lit";
import { sampleMarkdown } from "../sample-markdown";

export interface StreamingState {
  text: string;
  charCount: number;
  currentIndex: number;
}

export function getInitialStreamingState(): StreamingState {
  return {
    text: sampleMarkdown,
    charCount: sampleMarkdown.length,
    currentIndex: sampleMarkdown.length,
  };
}

export function getEmptyStreamingState(): StreamingState {
  return {
    text: "",
    charCount: 0,
    currentIndex: 0,
  };
}

export function getFullStreamingState(): StreamingState {
  return {
    text: sampleMarkdown,
    charCount: sampleMarkdown.length,
    currentIndex: sampleMarkdown.length,
  };
}

export function getSampleMarkdown(): string {
  return sampleMarkdown;
}

export interface StreamingControlsOptions {
  isStreaming: boolean;
  controlsCollapsed: boolean;
  onStart: () => void;
  onStop: () => void;
  onLoadInstant: () => void;
  onClear: () => void;
  onToggleControls: () => void;
  commonControls: TemplateResult;
}

export function renderStreamingControls(options: StreamingControlsOptions): TemplateResult {
  const { isStreaming, controlsCollapsed, onStart, onStop, onLoadInstant, onClear, onToggleControls, commonControls } = options;
  
  return html`
    <div class="controls ${controlsCollapsed ? 'collapsed' : ''}">
      <div class="controls-header" @click=${onToggleControls}>
        <span>Controls</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </div>
      <div class="controls-content">
        <div class="controls-row">
          <button class="btn-primary" @click=${onStart} ?disabled=${isStreaming}>
            Start Streaming
          </button>
          <button class="btn-secondary" @click=${onStop} ?disabled=${!isStreaming}>
            Stop
          </button>
          <button class="btn-secondary" @click=${onLoadInstant} ?disabled=${isStreaming}>
            Load Instant
          </button>
          <button class="btn-danger" @click=${onClear} ?disabled=${isStreaming}>
            Clear
          </button>
        </div>
        ${commonControls}
      </div>
    </div>
  `;
}

export interface StreamingViewerOptions {
  text: string;
  isStreaming: boolean;
  isDark: boolean;
}

export function renderStreamingViewer(options: StreamingViewerOptions): TemplateResult {
  const { text, isStreaming, isDark } = options;
  
  return html`
    <div class="viewer-container">
      <markdown-viewer
        .text=${text}
        ?is-streaming=${isStreaming}
        throttle-ms="50"
        class=${isDark ? "dark" : ""}
      ></markdown-viewer>
    </div>
  `;
}

export interface StreamingStatusOptions {
  charCount: number;
  totalChars: number;
}

export function renderStreamingStatus(options: StreamingStatusOptions): TemplateResult {
  const { charCount, totalChars } = options;
  const progress = totalChars > 0 ? Math.round((charCount / totalChars) * 100) : 0;
  
  return html`
    <div class="status-item">
      <span class="status-label">Progress:</span>
      <span class="status-value">${progress}%</span>
    </div>
  `;
}
