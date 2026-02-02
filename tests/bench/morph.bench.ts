/**
 * DOM Morph Performance Benchmarks (Browser)
 * 
 * Run with: npm run bench:browser
 */

import { bench, describe } from 'vitest';
import { renderMarkdown } from '../../src/components/markdown-viewer/parser';
import { morphContentSync, resetMorphCache } from '../../src/components/markdown-viewer/morph';
import { cacheManager } from '../../src/components/markdown-viewer/cache-manager';

// =============================================================================
// Content Generators
// =============================================================================

function generateParagraphs(count: number): string {
  const paragraph = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
  return Array(count).fill(paragraph).join('\n\n');
}

function generateCodeBlocks(count: number): string {
  const code = `function example(n) {
  if (n <= 1) return n;
  return example(n - 1) + example(n - 2);
}`;
  let content = '';
  for (let i = 0; i < count; i++) {
    content += `\`\`\`javascript\n${code}\n\`\`\`\n\n`;
  }
  return content;
}

function generateTables(count: number, rows: number = 5): string {
  let content = '';
  for (let i = 0; i < count; i++) {
    content += '| Col A | Col B | Col C |\n|-------|-------|-------|\n';
    for (let r = 0; r < rows; r++) {
      content += `| ${r}A | ${r}B | ${r}C |\n`;
    }
    content += '\n';
  }
  return content;
}

function generateMixedContent(sections: number): string {
  let content = '# Document\n\n';
  for (let i = 0; i < sections; i++) {
    content += `## Section ${i + 1}\n\n`;
    content += generateParagraphs(2) + '\n\n';
    content += generateCodeBlocks(1);
    content += generateTables(1, 3);
  }
  return content;
}

// =============================================================================
// Pre-rendered HTML Content
// =============================================================================

const MARKDOWN = {
  small: generateParagraphs(5),
  medium: generateMixedContent(5),
  large: generateMixedContent(20),
};

const HTML = {
  small: renderMarkdown(MARKDOWN.small, true),
  medium: renderMarkdown(MARKDOWN.medium, true),
  large: renderMarkdown(MARKDOWN.large, true),
};

// Incremental content for streaming simulation
const STREAMING_CHUNKS = (() => {
  const full = MARKDOWN.medium;
  const chunks: string[] = [];
  const chunkCount = 20;
  const chunkSize = Math.ceil(full.length / chunkCount);
  
  for (let i = 1; i <= chunkCount; i++) {
    const partial = full.slice(0, i * chunkSize);
    chunks.push(renderMarkdown(partial, true));
  }
  return chunks;
})();

// =============================================================================
// Helper: Create fresh container for each iteration
// =============================================================================

function withContainer(fn: (container: HTMLDivElement) => void): void {
  const el = document.createElement('div');
  el.className = 'markdown';
  el.style.cssText = 'position: absolute; left: -9999px; width: 800px;';
  document.body.appendChild(el);
  
  resetMorphCache();
  cacheManager.morphCache.clear();
  
  fn(el);
  
  el.remove();
}

// =============================================================================
// Benchmarks
// =============================================================================

describe('Morph - Initial Render', () => {
  bench('small (~1KB HTML)', () => {
    withContainer((container) => {
      morphContentSync(container, HTML.small);
    });
  });
  
  bench('medium (~5KB HTML)', () => {
    withContainer((container) => {
      morphContentSync(container, HTML.medium);
    });
  });
  
  bench('large (~20KB HTML)', () => {
    withContainer((container) => {
      morphContentSync(container, HTML.large);
    });
  });
});

describe('Morph - Streaming Simulation', () => {
  bench('20 incremental morphs', () => {
    withContainer((container) => {
      for (const chunk of STREAMING_CHUNKS) {
        resetMorphCache(); // Force re-morph each time
        morphContentSync(container, chunk);
      }
    });
  });
});

describe('Morph - Hash Skip (No Change)', () => {
  bench('skip unchanged content', () => {
    withContainer((container) => {
      // First morph
      morphContentSync(container, HTML.medium);
      // Second morph - should skip via hash
      morphContentSync(container, HTML.medium);
    });
  });
});

describe('Morph - Append Content', () => {
  const base = renderMarkdown(generateParagraphs(10), true);
  const appended = renderMarkdown(generateParagraphs(10) + '\n\nNew paragraph.', true);
  
  bench('append to existing DOM', () => {
    withContainer((container) => {
      morphContentSync(container, base);
      resetMorphCache();
      morphContentSync(container, appended);
    });
  });
});
