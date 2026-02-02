/**
 * Parser Performance Benchmarks
 * 
 * Run with: npm run bench
 * Compare with: npm run bench -- --outputJson bench-results.json
 */

import { bench, describe, beforeAll } from 'vitest';
import { renderMarkdown } from '../../src/components/markdown-viewer/parser';
import { cacheManager } from '../../src/components/markdown-viewer/cache-manager';

// =============================================================================
// Sample Content Generators
// =============================================================================

function generateParagraphs(count: number): string {
  const paragraph = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.';
  return Array(count).fill(paragraph).join('\n\n');
}

function generateHeadingsAndParagraphs(count: number): string {
  let content = '';
  for (let i = 0; i < count; i++) {
    const level = (i % 3) + 1;
    content += `${'#'.repeat(level)} Heading ${i + 1}\n\n`;
    content += 'This is a paragraph with **bold**, *italic*, and `inline code`.\n\n';
  }
  return content;
}

function generateCodeBlocks(count: number): string {
  const code = `function example(n) {
  if (n <= 1) return n;
  return example(n - 1) + example(n - 2);
}

const result = example(10);
console.log(result);`;
  
  let content = '';
  for (let i = 0; i < count; i++) {
    content += `\`\`\`javascript\n${code}\n\`\`\`\n\n`;
  }
  return content;
}

function generateTables(count: number, rows: number = 5): string {
  let content = '';
  for (let i = 0; i < count; i++) {
    content += '| Column A | Column B | Column C | Column D |\n';
    content += '|----------|----------|----------|----------|\n';
    for (let r = 0; r < rows; r++) {
      content += `| Cell ${r}A | Cell ${r}B | Cell ${r}C | Cell ${r}D |\n`;
    }
    content += '\n';
  }
  return content;
}

function generateMath(count: number): string {
  const inlineMath = '$E = mc^2$';
  const displayMath = '$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$';
  
  let content = '';
  for (let i = 0; i < count; i++) {
    content += `Here is inline math: ${inlineMath} and more text.\n\n`;
    content += `${displayMath}\n\n`;
  }
  return content;
}

function generateNestedLists(depth: number, itemsPerLevel: number): string {
  function buildList(currentDepth: number): string {
    if (currentDepth > depth) return '';
    
    let content = '';
    for (let i = 0; i < itemsPerLevel; i++) {
      const indent = '  '.repeat(currentDepth - 1);
      content += `${indent}- Item ${currentDepth}.${i + 1}\n`;
      content += buildList(currentDepth + 1);
    }
    return content;
  }
  
  return buildList(1);
}

function generateMixedContent(sections: number): string {
  let content = '# Mixed Content Document\n\n';
  
  for (let i = 0; i < sections; i++) {
    content += `## Section ${i + 1}\n\n`;
    content += generateParagraphs(2);
    content += '\n\n';
    content += generateCodeBlocks(1);
    content += generateTables(1, 3);
    content += generateMath(1);
    content += '- List item 1\n- List item 2\n  - Nested item\n\n';
  }
  
  return content;
}

// =============================================================================
// Pre-generated Content (to avoid generation overhead in benchmarks)
// =============================================================================

const CONTENT = {
  // Small (~1KB)
  small: {
    paragraphs: generateParagraphs(5),
    headings: generateHeadingsAndParagraphs(5),
    code: generateCodeBlocks(2),
  },
  
  // Medium (~10KB)
  medium: {
    paragraphs: generateParagraphs(50),
    headings: generateHeadingsAndParagraphs(30),
    code: generateCodeBlocks(15),
    tables: generateTables(5, 10),
    math: generateMath(20),
    mixed: generateMixedContent(5),
  },
  
  // Large (~50KB)
  large: {
    paragraphs: generateParagraphs(250),
    headings: generateHeadingsAndParagraphs(100),
    code: generateCodeBlocks(50),
    tables: generateTables(20, 15),
    math: generateMath(50),
    mixed: generateMixedContent(20),
  },
  
  // Stress (~100KB+)
  stress: {
    paragraphs: generateParagraphs(500),
    code: generateCodeBlocks(100),
    tables: generateTables(50, 20),
    mixed: generateMixedContent(50),
  },
};

// Log content sizes
console.log('\n📊 Content Sizes:');
console.log(`  Small paragraphs:  ${(CONTENT.small.paragraphs.length / 1024).toFixed(1)}KB`);
console.log(`  Medium mixed:      ${(CONTENT.medium.mixed.length / 1024).toFixed(1)}KB`);
console.log(`  Large mixed:       ${(CONTENT.large.mixed.length / 1024).toFixed(1)}KB`);
console.log(`  Stress mixed:      ${(CONTENT.stress.mixed.length / 1024).toFixed(1)}KB`);
console.log('');

// =============================================================================
// Benchmarks
// =============================================================================

describe('Parser - Small Content (~1KB)', () => {
  beforeAll(() => cacheManager.clearAll());
  
  bench('paragraphs (cold)', () => {
    cacheManager.clearAll();
    renderMarkdown(CONTENT.small.paragraphs, false);
  });
  
  bench('paragraphs (warm)', () => {
    renderMarkdown(CONTENT.small.paragraphs, false);
  });
  
  bench('headings + formatting', () => {
    cacheManager.clearAll();
    renderMarkdown(CONTENT.small.headings, false);
  });
  
  bench('code blocks', () => {
    cacheManager.clearAll();
    renderMarkdown(CONTENT.small.code, false);
  });
});

describe('Parser - Medium Content (~10KB)', () => {
  beforeAll(() => cacheManager.clearAll());
  
  bench('paragraphs', () => {
    cacheManager.clearAll();
    renderMarkdown(CONTENT.medium.paragraphs, false);
  });
  
  bench('code blocks', () => {
    cacheManager.clearAll();
    renderMarkdown(CONTENT.medium.code, false);
  });
  
  bench('tables', () => {
    cacheManager.clearAll();
    renderMarkdown(CONTENT.medium.tables, false);
  });
  
  bench('math (KaTeX)', () => {
    cacheManager.clearAll();
    renderMarkdown(CONTENT.medium.math, false);
  });
  
  bench('mixed content', () => {
    cacheManager.clearAll();
    renderMarkdown(CONTENT.medium.mixed, false);
  });
  
  bench('mixed content (warm cache)', () => {
    renderMarkdown(CONTENT.medium.mixed, false);
  });
});

describe('Parser - Large Content (~50KB)', () => {
  beforeAll(() => cacheManager.clearAll());
  
  bench('paragraphs', () => {
    cacheManager.clearAll();
    renderMarkdown(CONTENT.large.paragraphs, false);
  });
  
  bench('code blocks', () => {
    cacheManager.clearAll();
    renderMarkdown(CONTENT.large.code, false);
  });
  
  bench('tables', () => {
    cacheManager.clearAll();
    renderMarkdown(CONTENT.large.tables, false);
  });
  
  bench('math (KaTeX)', () => {
    cacheManager.clearAll();
    renderMarkdown(CONTENT.large.math, false);
  });
  
  bench('mixed content', () => {
    cacheManager.clearAll();
    renderMarkdown(CONTENT.large.mixed, false);
  });
});

describe('Parser - Stress Test (~100KB+)', () => {
  beforeAll(() => cacheManager.clearAll());
  
  bench('paragraphs', () => {
    cacheManager.clearAll();
    renderMarkdown(CONTENT.stress.paragraphs, false);
  });
  
  bench('code blocks', () => {
    cacheManager.clearAll();
    renderMarkdown(CONTENT.stress.code, false);
  });
  
  bench('tables', () => {
    cacheManager.clearAll();
    renderMarkdown(CONTENT.stress.tables, false);
  });
  
  bench('mixed content', () => {
    cacheManager.clearAll();
    renderMarkdown(CONTENT.stress.mixed, false);
  });
});

describe('Parser - Streaming Simulation', () => {
  const fullContent = CONTENT.medium.mixed;
  const chunks = 20;
  const chunkSize = Math.ceil(fullContent.length / chunks);
  
  bench('incremental parse (sync strategy)', () => {
    cacheManager.clearAll();
    for (let i = 1; i <= chunks; i++) {
      const partial = fullContent.slice(0, i * chunkSize);
      renderMarkdown(partial, true); // sync strategy for streaming
    }
  });
});

describe('Parser - Cache Effectiveness', () => {
  const content = CONTENT.medium.mixed;
  
  bench('first render (cache miss)', () => {
    cacheManager.clearAll();
    renderMarkdown(content, false);
  });
  
  bench('second render (cache hit)', () => {
    // Don't clear cache - should be instant
    renderMarkdown(content, false);
  });
});
