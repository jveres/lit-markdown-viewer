import katex from 'katex';
import { decodeHtml } from './utils';
import { markdownToHTML } from '@nick/comrak';
import { cacheManager } from './cache-manager';

/**
 * Cursor marker string and HTML replacement
 * Zero Width Space (ZWSP)
 */
export const CURSOR_MARKER = '\u200B';
export const CURSOR_HTML = "<span id='cursor' class='cursor'></span>";

// --------------------------------------------------------------------------
// Hoisted Regex Patterns
// --------------------------------------------------------------------------

/** Matches <pre><code>...</code></pre> and inline <code>...</code> */
// Group 1: <pre...> (optional)
// Group 2: <code...>
// Group 3: content
// Group 4: </code>
// Group 5: </pre> (optional)
const CODE_AND_FENCE_RE = /(<pre[^>]*>)?(<code[^>]*>)([\s\S]*?)(<\/code>)(<\/pre>)?/g;

/** Matches <span data-math-style="inline|display">...</span> */
const MATH_SPAN_RE = /<span data-math-style="(inline|display)">([\s\S]*?)<\/span>/g;

/** Matches <table>...</table> */
const TABLE_RE = /(<table>[\s\S]*?<\/table>)/g;

/** Matches <a ...> tags */
const ANCHOR_TAG_RE = /<a\s+([^>]+)>/gi;

/** Matches hex, rgb, rgba, hsl, hsla colors */
const COLOR_RE = /#([0-9a-fA-F]{3,8})\b|(?:rgba?|hsla?)\([\d\s,.%]+\)/gi;

export interface ColorOptions {
  fences: boolean;
  inline: boolean;
}



// --------------------------------------------------------------------------
// Main Render Function
// --------------------------------------------------------------------------

/**
 * Render Markdown to HTML using Comrak + Post-processing
 * @param src Markdown source
 * @param useSyncStrategy If true, attempts main-thread highlight first (for streaming stability).
 * @param colorOptions Options for color preview injection.
 */
export function renderMarkdown(
  src: string,
  useSyncStrategy: boolean,
  colorOptions: ColorOptions = { fences: true, inline: true }
): string {
  if (!src) return '';

  // Check global cache for repeated content (e.g., reloading same chat)
  // Use separate caches for sync/async strategies to avoid key concatenation
  const renderCache = useSyncStrategy ? cacheManager.renderCacheSync : cacheManager.renderCacheAsync;
  const cached = renderCache.get(src);
  if (cached !== undefined) {
    return cached;
  }

  // 1. Comrak Render
  // Note: We use a configured instance of comrak.
  // Extensions and options should match the desired output.
  let html = markdownToHTML(src, {
    extension: {
      strikethrough: true,
      tagfilter: true,
      table: true,
      autolink: true,
      tasklist: true,
      superscript: true,
      subscript: true,
      alerts: true,
      mathDollars: true,
      underline: true,
      headerIDs: '',
      shortcodes: true,
      descriptionLists: true,
      footnotes: true
    },
    parse: {
      smart: true,
      ignoreSetext: true
    },
    render: {
      unsafe: true,
      escape: false,
      hardbreaks: false,
      tasklistClasses: true,
      ignoreEmptyLinks: true
    }
  });

  // 2. Post-process Pipeline
  // Optimized to minimize passes over the large string.

  // Math (Katex) - often localized, do first
  html = processMath(html);

  // Code & Colors - Heavy lifting, combined pass
  html = processCodeAndColors(html, useSyncStrategy, colorOptions);

  // Tables - Wraps tables
  html = processTables(html);

  // Links - Security and targets
  html = processLinks(html);

  // 3. Inject Cursor
  if (html.includes(CURSOR_MARKER)) {
    html = html.replaceAll(CURSOR_MARKER, CURSOR_HTML);
  }

  // Cache the result (skip cursor-containing content as it's transient)
  if (!html.includes(CURSOR_HTML)) {
    renderCache.set(src, html);
  }

  return html;
}

// --------------------------------------------------------------------------
// Post-Processors
// --------------------------------------------------------------------------

/**
 * Process Code Blocks and Inline Code (Colors + Sync Strategy)
 */
function processCodeAndColors(
  html: string,
  useSyncStrategy: boolean,
  options: ColorOptions
): string {
  if (!html.includes('<code')) return html;

  return html.replace(
    CODE_AND_FENCE_RE,
    (_match, preOpen, codeOpen, content, codeClose, preClose) => {
      const isBlock = !!preOpen && !!preClose;

      // Check if we should apply colors
      const doColors = (isBlock && options.fences) || (!isBlock && options.inline);

      // 1. Color Processing
      let finalContent = content;
      if (doColors) {
        // Fast check for color-like strings
        if (
          finalContent.includes('#') ||
          finalContent.includes('rgb') ||
          finalContent.includes('hsl')
        ) {
          finalContent = finalContent.replace(COLOR_RE, (colorMatch: string) => {
            if (colorMatch.startsWith('#')) {
              const hex = colorMatch.slice(1);
              // Validate hex length
              if (![3, 4, 6, 8].includes(hex.length)) {
                return colorMatch;
              }
            }
            return `<span style="white-space: nowrap;"><span class="color-box" style="background-color: ${colorMatch};"></span>${colorMatch}</span>`;
          });
        }
      }

      // 2. Block Logic (Sync Strategy / Line wrapping)
      if (isBlock) {
        // Trim trailing newline often added by parsers
        if (finalContent.endsWith('\n')) {
          finalContent = finalContent.slice(0, -1);
        }

        if (useSyncStrategy) {
          // Use regex for better performance (avoids intermediate array allocation)
          finalContent = finalContent.replace(/^(.*)$/gm, '<span class="code-line">$1</span>');
        }

        // Wrap in container with copy button (using Lucide icons)
        const codeBlock = `${preOpen}${codeOpen}${finalContent}${codeClose}${preClose}`;
        const copyIcon = `<svg class="copy-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
        const checkIcon = `<svg class="check-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
        return `<div class="code-block-wrapper"><button type="button" class="copy-btn" aria-label="Copy code">${copyIcon}${checkIcon}</button>${codeBlock}</div>`;
      }

      // Inline return
      return `${preOpen || ''}${codeOpen}${finalContent}${codeClose}${preClose || ''}`;
    }
  );
}



/**
 * Process Math Blocks (KaTeX)
 */
function processMath(html: string): string {
  if (!html.includes('data-math-style')) return html;

  return html.replace(MATH_SPAN_RE, (match, style, content) => {
    const isDisplay = style === 'display';
    
    // Check if cursor marker is present (during streaming)
    const hasCursor = content.includes(CURSOR_MARKER);
    
    // Strip cursor marker from content before KaTeX processing
    const cleanContent = hasCursor ? content.replaceAll(CURSOR_MARKER, '') : content;
    
    // Use separate caches for display/inline to avoid key concatenation
    const katexCache = isDisplay ? cacheManager.katexCacheDisplay : cacheManager.katexCacheInline;

    const cached = katexCache.get(cleanContent);
    if (cached !== undefined) {
      // Re-append cursor marker if it was present
      return hasCursor ? cached + CURSOR_MARKER : cached;
    }

    const tex = decodeHtml(cleanContent);

    try {
      const result = katex.renderToString(tex, {
        displayMode: isDisplay,
        throwOnError: false,
        strict: false,  // Suppress warnings for edge cases
        trust: true
      });

      katexCache.set(cleanContent, result);

      // Re-append cursor marker if it was present
      return hasCursor ? result + CURSOR_MARKER : result;
    } catch {
      return match;
    }
  });
}

/**
 * Wrap tables in scrollable container
 */
function processTables(html: string): string {
  if (!html.includes('<table')) return html;
  return html.replace(TABLE_RE, '<div class="table-wrapper">$1</div>');
}

/** Matches javascript: hrefs for sanitization */
const JAVASCRIPT_HREF_RE = /href\s*=\s*["']\s*javascript:[^"']*["']/gi;

/** Extracts href value from attributes */
const HREF_VALUE_RE = /href\s*=\s*["']([^"']*)["']/i;

/**
 * Sanitize links and add targets
 */
function processLinks(html: string): string {
  if (!html.includes('<a')) return html;

  return html.replace(ANCHOR_TAG_RE, (_match, attributes) => {
    // 1. Sanitize javascript: hrefs
    let newAttributes = attributes.replace(JAVASCRIPT_HREF_RE, 'href="#"');

    // 2. Add target="_blank" to external links
    const hrefMatch = HREF_VALUE_RE.exec(newAttributes);
    if (hrefMatch) {
      const href = hrefMatch[1];
      // External links: not anchor (#) and not relative (/)
      if (href && !href.startsWith('#') && !href.startsWith('/')) {
        if (!newAttributes.includes('target=')) {
          newAttributes += ' target="_blank" rel="noopener noreferrer"';
        }
      }
    }

    return `<a ${newAttributes}>`;
  });
}
