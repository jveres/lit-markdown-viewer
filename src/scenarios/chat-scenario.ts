// ─────────────────────────────────────────────────────────────────────────────
// Chat Scenario - AI Chat Simulation with 50 Messages
// ─────────────────────────────────────────────────────────────────────────────

import { html } from "lit";
import type { TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { generateChatMessages } from "./chat-data";
import type { ChatMessage } from "./chat-data";

export type { ChatMessage };
export { generateChatMessages };

export interface ChatState {
  messages: ChatMessage[];
  streamingMessageId: number | null;
  streamingContent: string;
  charCount: number;
}

export function getInitialChatState(): ChatState {
  const messages = generateChatMessages(50);
  return {
    messages,
    streamingMessageId: null,
    streamingContent: "",
    charCount: messages.reduce((sum, m) => sum + m.content.length, 0),
  };
}

export function getEmptyChatState(): ChatState {
  return {
    messages: [],
    streamingMessageId: null,
    streamingContent: "",
    charCount: 0,
  };
}

export interface ChatControlsOptions {
  isStreaming: boolean;
  controlsCollapsed: boolean;
  onStart: () => void;
  onStop: () => void;
  onReload: () => void;
  onClear: () => void;
  onToggleControls: () => void;
  commonControls: TemplateResult;
}

export function renderChatControls(options: ChatControlsOptions): TemplateResult {
  const { isStreaming, controlsCollapsed, onStart, onStop, onReload, onClear, onToggleControls, commonControls } = options;
  
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
            Stream New Chat
          </button>
          <button class="btn-secondary" @click=${onStop} ?disabled=${!isStreaming}>
            Stop
          </button>
          <button class="btn-secondary" @click=${onReload} ?disabled=${isStreaming}>
            Reload
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

export interface ChatViewerOptions {
  messages: ChatMessage[];
  streamingMessageId: number | null;
  isDark: boolean;
}

export function renderChatViewer(options: ChatViewerOptions): TemplateResult {
  const { messages, streamingMessageId, isDark } = options;
  
  return html`
    <div class="chat-container">
      <div class="chat-messages">
        ${repeat(
          messages,
          (msg) => msg.id,
          (msg) => html`
            <div class="chat-message ${msg.role}">
              <div class="chat-avatar">
                ${msg.role === 'user' ? 'U' : 'AI'}
              </div>
              <div class="chat-bubble">
                <markdown-viewer
                  .text=${msg.content}
                  ?is-streaming=${streamingMessageId === msg.id}
                  throttle-ms="50"
                  class=${isDark ? "dark" : ""}
                ></markdown-viewer>
              </div>
            </div>
          `
        )}
      </div>
    </div>
  `;
}

export interface ChatStatusOptions {
  messageCount: number;
}

export function renderChatStatus(options: ChatStatusOptions): TemplateResult {
  return html`
    <div class="status-item">
      <span class="status-label">Messages:</span>
      <span class="status-value">${options.messageCount}</span>
    </div>
  `;
}
