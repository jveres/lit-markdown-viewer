import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  morphContent, 
  morphContentSync, 
  resetMorphCache,
  morphContentOptimized,
  getMorphStats,
  resetElementMorphState
} from '../../src/components/markdown-viewer/morph';
import { cacheManager } from '../../src/components/markdown-viewer/cache-manager';

describe('morph', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    // Create a fresh container for each test
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
    
    // Clear caches
    cacheManager.clearAll();
    resetMorphCache(container);
  });

  afterEach(() => {
    resetMorphCache(container);
    container.remove();
  });

  describe('morphContentSync', () => {
    it('should morph content into empty element', () => {
      morphContentSync(container, '<p>Hello</p>');
      
      expect(container.innerHTML).toBe('<p>Hello</p>');
    });

    it('should morph content replacing existing content', () => {
      container.innerHTML = '<p>Old content</p>';
      
      morphContentSync(container, '<p>New content</p>');
      
      expect(container.innerHTML).toBe('<p>New content</p>');
    });

    it('should skip morph when content hash matches', () => {
      const html = '<p>Same content</p>';
      
      // First morph
      morphContentSync(container, html);
      expect(container.innerHTML).toBe(html);
      
      // Modify container directly
      container.innerHTML = '<p>Modified</p>';
      
      // Second morph with same content - should skip due to hash match
      morphContentSync(container, html);
      
      // Content should remain modified because morph was skipped
      expect(container.innerHTML).toBe('<p>Modified</p>');
    });

    it('should morph when content changes', () => {
      morphContentSync(container, '<p>First</p>');
      expect(container.innerHTML).toBe('<p>First</p>');
      
      morphContentSync(container, '<p>Second</p>');
      expect(container.innerHTML).toBe('<p>Second</p>');
    });

    it('should preserve elements with data-morph-ignore', () => {
      container.innerHTML = '<div data-morph-ignore>Keep me</div><p>Change me</p>';
      
      morphContentSync(container, '<p>New content only</p>');
      
      // The ignored element should be preserved
      const ignoredEl = container.querySelector('[data-morph-ignore]');
      expect(ignoredEl).toBeTruthy();
      expect(ignoredEl?.textContent).toBe('Keep me');
    });

    it('should handle complex nested structures', () => {
      const complexHtml = `
        <div class="wrapper">
          <h1>Title</h1>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </div>
      `.trim();
      
      morphContentSync(container, complexHtml);
      
      expect(container.querySelector('h1')?.textContent).toBe('Title');
      expect(container.querySelectorAll('li').length).toBe(2);
    });

    it('should update attributes on existing elements', () => {
      container.innerHTML = '<button class="old">Click</button>';
      
      morphContentSync(container, '<button class="new" disabled>Click</button>');
      
      const button = container.querySelector('button');
      expect(button?.className).toBe('new');
      expect(button?.hasAttribute('disabled')).toBe(true);
    });

    it('should handle adding new elements', () => {
      container.innerHTML = '<p>Paragraph 1</p>';
      
      morphContentSync(container, '<p>Paragraph 1</p><p>Paragraph 2</p>');
      
      expect(container.querySelectorAll('p').length).toBe(2);
    });

    it('should handle removing elements', () => {
      container.innerHTML = '<p>Keep</p><p>Remove</p>';
      
      morphContentSync(container, '<p>Keep</p>');
      
      expect(container.querySelectorAll('p').length).toBe(1);
      expect(container.textContent).toBe('Keep');
    });

    it('should handle empty new content', () => {
      container.innerHTML = '<p>Content</p>';
      
      morphContentSync(container, '');
      
      expect(container.innerHTML).toBe('');
    });
  });

  describe('morphContent (async)', () => {
    it('should morph content on next animation frame', async () => {
      morphContent(container, '<p>Async content</p>');
      
      // Content should not be updated immediately
      expect(container.innerHTML).toBe('');
      
      // Wait for RAF
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      expect(container.innerHTML).toBe('<p>Async content</p>');
    });

    it('should batch multiple morphs into single RAF', async () => {
      morphContent(container, '<p>First</p>');
      morphContent(container, '<p>Second</p>');
      morphContent(container, '<p>Third</p>');
      
      // Wait for RAF
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      // Only the last morph should be applied
      expect(container.innerHTML).toBe('<p>Third</p>');
    });

    it('should skip morph when content hash matches', async () => {
      const html = '<p>Same content</p>';
      
      // First morph (sync to set up cache)
      morphContentSync(container, html);
      
      // Modify container
      container.innerHTML = '<p>Modified</p>';
      
      // Async morph with same hash - should skip
      morphContent(container, html);
      
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      // Content should remain modified
      expect(container.innerHTML).toBe('<p>Modified</p>');
    });
  });

  describe('resetMorphCache', () => {
    it('should clear per-element state', () => {
      morphContentSync(container, '<p>Content</p>');
      
      // Modify container directly
      container.innerHTML = '<p>Modified</p>';
      
      // Same content morph would be skipped due to per-element hash
      morphContentSync(container, '<p>Content</p>');
      expect(container.innerHTML).toBe('<p>Modified</p>');
      
      // Reset clears the state
      resetMorphCache(container);
      
      // Now morph should work again
      morphContentSync(container, '<p>Content</p>');
      expect(container.innerHTML).toBe('<p>Content</p>');
    });

    it('should allow re-morphing same content after reset', () => {
      const html = '<p>Content</p>';
      
      // First morph
      morphContentSync(container, html);
      
      // Modify container
      container.innerHTML = '<p>Modified</p>';
      
      // This morph would be skipped due to cache
      morphContentSync(container, html);
      expect(container.innerHTML).toBe('<p>Modified</p>');
      
      // Reset cache
      resetMorphCache(container);
      
      // Now morph should work
      morphContentSync(container, html);
      expect(container.innerHTML).toBe('<p>Content</p>');
    });

    it('should cancel pending async morph', async () => {
      morphContent(container, '<p>Pending</p>');
      
      // Reset before RAF fires
      resetMorphCache(container);
      
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      // Pending morph should have been cancelled
      expect(container.innerHTML).toBe('');
    });
    
    it('should only reset state for specified container', () => {
      const container2 = document.createElement('div');
      document.body.appendChild(container2);
      
      // Set up both containers
      morphContentSync(container, '<p>A</p>');
      morphContentSync(container2, '<p>B</p>');
      
      // Modify both
      container.innerHTML = '<p>Modified A</p>';
      container2.innerHTML = '<p>Modified B</p>';
      
      // Reset only container1
      resetMorphCache(container);
      
      // Container1 can be re-morphed
      morphContentSync(container, '<p>A</p>');
      expect(container.innerHTML).toBe('<p>A</p>');
      
      // Container2 is still cached (morph skipped)
      morphContentSync(container2, '<p>B</p>');
      expect(container2.innerHTML).toBe('<p>Modified B</p>');
      
      container2.remove();
    });
  });

  describe('hash collision handling', () => {
    it('should morph different content with same length', () => {
      // Different content, same length - djb2 hash should differentiate
      morphContentSync(container, '<p>AAAA</p>');
      expect(container.innerHTML).toBe('<p>AAAA</p>');
      
      morphContentSync(container, '<p>BBBB</p>');
      expect(container.innerHTML).toBe('<p>BBBB</p>');
    });
  });

  describe('special content handling', () => {
    it('should handle HTML entities', () => {
      morphContentSync(container, '<p>&lt;script&gt;</p>');
      
      expect(container.querySelector('p')?.textContent).toBe('<script>');
    });

    it('should handle special characters', () => {
      morphContentSync(container, '<p>Special: é ñ 中文 🎉</p>');
      
      expect(container.textContent).toContain('é');
      expect(container.textContent).toContain('🎉');
    });

    it('should handle inline styles', () => {
      morphContentSync(container, '<p style="color: red;">Styled</p>');
      
      const p = container.querySelector('p') as HTMLParagraphElement;
      expect(p.style.color).toBe('red');
    });

    it('should handle SVG content', () => {
      const svg = '<svg width="100" height="100"><circle cx="50" cy="50" r="40"/></svg>';
      morphContentSync(container, svg);
      
      expect(container.querySelector('svg')).toBeTruthy();
      expect(container.querySelector('circle')).toBeTruthy();
    });
  });

  describe('morphContentOptimized', () => {
    beforeEach(() => {
      resetElementMorphState(container);
    });

    describe('basic element-level skipping', () => {
      it('should skip unchanged elements', () => {
        const html1 = '<p>Paragraph 1</p><p>Paragraph 2</p>';
        morphContentOptimized(container, html1);
        
        // Same content - should skip all
        morphContentOptimized(container, html1);
        
        const stats = getMorphStats(container);
        expect(stats.skipped).toBe(2);
        expect(stats.updated).toBe(0);
      });

      it('should only update changed element', () => {
        morphContentOptimized(container, '<p>A</p><p>B</p><p>C</p>');
        
        // Change only middle element
        morphContentOptimized(container, '<p>A</p><p>B-changed</p><p>C</p>');
        
        const stats = getMorphStats(container);
        expect(stats.updated).toBe(1);
        expect(stats.skipped).toBe(2);
      });

      it('should track added elements', () => {
        morphContentOptimized(container, '<p>First</p>');
        
        // Add second element
        morphContentOptimized(container, '<p>First</p><p>Second</p>');
        
        const stats = getMorphStats(container);
        expect(stats.skipped).toBe(1);
        expect(stats.added).toBe(1);
      });

      it('should track removed elements', () => {
        morphContentOptimized(container, '<p>A</p><p>B</p><p>C</p>');
        
        // Remove last element
        morphContentOptimized(container, '<p>A</p><p>B</p>');
        
        const stats = getMorphStats(container);
        expect(stats.removed).toBe(1);
        expect(container.children.length).toBe(2);
      });
    });

    describe('element identity preservation', () => {
      it('should preserve DOM references for skipped elements', () => {
        morphContentOptimized(container, '<p id="p1">First</p><p id="p2">Second</p>');
        
        const originalP1 = container.querySelector('#p1');
        const originalP2 = container.querySelector('#p2');
        
        // Only change second paragraph
        morphContentOptimized(container, '<p id="p1">First</p><p id="p2">Changed</p>');
        
        // First paragraph should be same DOM node (skipped)
        expect(container.querySelector('#p1')).toBe(originalP1);
        
        // Stats should show skip
        expect(getMorphStats(container).skipped).toBe(1);
      });

      it('should preserve event listeners on skipped elements', () => {
        morphContentOptimized(container, '<button id="btn">Click</button><p>Text</p>');
        
        let clicked = false;
        const btn = container.querySelector('#btn') as HTMLButtonElement;
        btn.addEventListener('click', () => { clicked = true; });
        
        // Update only the paragraph
        morphContentOptimized(container, '<button id="btn">Click</button><p>Changed</p>');
        
        // Button should still have listener
        (container.querySelector('#btn') as HTMLButtonElement).click();
        expect(clicked).toBe(true);
      });

      it('should preserve custom properties on skipped elements', () => {
        morphContentOptimized(container, '<div id="d1">A</div><div id="d2">B</div>');
        
        const d1 = container.querySelector('#d1') as any;
        d1.__customProp = 'preserved';
        
        // Only update second div
        morphContentOptimized(container, '<div id="d1">A</div><div id="d2">Changed</div>');
        
        expect((container.querySelector('#d1') as any).__customProp).toBe('preserved');
      });
    });

    describe('streaming simulation', () => {
      it('should efficiently handle append-only streaming', () => {
        // Simulate streaming: each update adds more content to the last block
        const updates = [
          '<p>Hello</p>',
          '<p>Hello</p><p>World</p>',
          '<p>Hello</p><p>World</p><p>!</p>',
        ];
        
        let totalSkipped = 0;
        let totalUpdated = 0;
        
        for (const html of updates) {
          morphContentOptimized(container, html);
          const stats = getMorphStats(container);
          totalSkipped += stats.skipped;
          totalUpdated += stats.updated;
        }
        
        // First update: 0 skipped (new content)
        // Second update: 1 skipped (first p unchanged)
        // Third update: 2 skipped (first two p unchanged)
        expect(totalSkipped).toBe(3);
      });

      it('should only update the active streaming block', () => {
        // Simulate a paragraph being streamed character by character
        const prefix = '<h1>Title</h1><p>Intro paragraph</p>';
        
        morphContentOptimized(container, prefix);
        
        // Now stream a new paragraph
        const streamingUpdates = [
          `${prefix}<p>S</p>`,
          `${prefix}<p>St</p>`,
          `${prefix}<p>Str</p>`,
          `${prefix}<p>Stre</p>`,
          `${prefix}<p>Strea</p>`,
          `${prefix}<p>Stream</p>`,
          `${prefix}<p>Streami</p>`,
          `${prefix}<p>Streamin</p>`,
          `${prefix}<p>Streaming</p>`,
        ];
        
        for (const html of streamingUpdates) {
          morphContentOptimized(container, html);
          const stats = getMorphStats(container);
          // First two blocks should always be skipped
          expect(stats.skipped).toBeGreaterThanOrEqual(2);
        }
        
        // Final state
        expect(container.children.length).toBe(3);
        expect(container.children[2].textContent).toBe('Streaming');
      });

      it('should handle streaming with new block creation', () => {
        const blocks = [
          '<h1>Title</h1>',
          '<h1>Title</h1><p>Para 1</p>',
          '<h1>Title</h1><p>Para 1</p><ul><li>Item</li></ul>',
          '<h1>Title</h1><p>Para 1</p><ul><li>Item</li></ul><p>Para 2</p>',
        ];
        
        const addedCounts: number[] = [];
        
        for (const html of blocks) {
          morphContentOptimized(container, html);
          addedCounts.push(getMorphStats(container).added);
        }
        
        // Each update (except first) should add exactly 1 block
        expect(addedCounts.slice(1)).toEqual([1, 1, 1]);
      });
    });

    describe('complex nested structures', () => {
      it('should handle nested lists correctly', () => {
        const nestedList = `
          <ul>
            <li>Item 1
              <ul>
                <li>Nested 1.1</li>
                <li>Nested 1.2</li>
              </ul>
            </li>
            <li>Item 2</li>
          </ul>
        `.trim();
        
        morphContentOptimized(container, nestedList);
        expect(container.querySelectorAll('li').length).toBe(4);
        
        // Same content - should skip
        morphContentOptimized(container, nestedList);
        expect(getMorphStats(container).skipped).toBe(1);
        expect(getMorphStats(container).updated).toBe(0);
      });

      it('should handle blockquotes with nested content', () => {
        const html1 = `
          <blockquote>
            <p>Quote paragraph 1</p>
            <p>Quote paragraph 2</p>
          </blockquote>
          <p>Regular paragraph</p>
        `.trim();
        
        morphContentOptimized(container, html1);
        
        // Change only the regular paragraph
        const html2 = `
          <blockquote>
            <p>Quote paragraph 1</p>
            <p>Quote paragraph 2</p>
          </blockquote>
          <p>Changed paragraph</p>
        `.trim();
        
        morphContentOptimized(container, html2);
        
        const stats = getMorphStats(container);
        expect(stats.skipped).toBe(1); // blockquote unchanged
        expect(stats.updated).toBe(1); // regular p changed
      });

      it('should handle tables as single blocks', () => {
        const table = `
          <table>
            <thead><tr><th>A</th><th>B</th></tr></thead>
            <tbody>
              <tr><td>1</td><td>2</td></tr>
              <tr><td>3</td><td>4</td></tr>
            </tbody>
          </table>
        `.trim();
        
        morphContentOptimized(container, table);
        expect(container.querySelectorAll('td').length).toBe(4);
        
        // Same table - should skip
        morphContentOptimized(container, table);
        expect(getMorphStats(container).skipped).toBe(1);
      });

      it('should handle code blocks with syntax highlighting spans', () => {
        const codeBlock = `
          <pre><code class="language-js">
            <span class="keyword">const</span> x = <span class="number">42</span>;
          </code></pre>
        `.trim();
        
        morphContentOptimized(container, codeBlock);
        
        const html2 = `
          <pre><code class="language-js">
            <span class="keyword">const</span> x = <span class="number">42</span>;
          </code></pre>
          <p>New paragraph</p>
        `.trim();
        
        morphContentOptimized(container, html2);
        
        expect(getMorphStats(container).skipped).toBe(1); // code block skipped
        expect(getMorphStats(container).added).toBe(1);   // paragraph added
      });

      it('should handle mixed complex content', () => {
        const complexDoc = `
          <h1>Document Title</h1>
          <p>Introduction with <strong>bold</strong> and <em>italic</em>.</p>
          <ul>
            <li>List item with <code>inline code</code></li>
            <li>Another item</li>
          </ul>
          <blockquote>
            <p>A wise quote</p>
          </blockquote>
          <pre><code>function test() { return true; }</code></pre>
          <table>
            <tr><th>Name</th><th>Value</th></tr>
            <tr><td>A</td><td>1</td></tr>
          </table>
        `.trim();
        
        morphContentOptimized(container, complexDoc);
        expect(container.children.length).toBe(6);
        
        // Same content - all should be skipped
        morphContentOptimized(container, complexDoc);
        expect(getMorphStats(container).skipped).toBe(6);
        expect(getMorphStats(container).updated).toBe(0);
      });

      it('should handle deeply nested divs', () => {
        const nested = `
          <div class="level-1">
            <div class="level-2">
              <div class="level-3">
                <p>Deep content</p>
              </div>
            </div>
          </div>
        `.trim();
        
        morphContentOptimized(container, nested);
        
        // Same content - should skip
        morphContentOptimized(container, nested);
        expect(getMorphStats(container).skipped).toBe(1);
        
        // Change deep content - should update entire block
        const changed = nested.replace('Deep content', 'Changed content');
        morphContentOptimized(container, changed);
        expect(getMorphStats(container).updated).toBe(1);
      });
    });

    describe('edge cases', () => {
      it('should handle empty content', () => {
        morphContentOptimized(container, '<p>Content</p>');
        expect(container.children.length).toBe(1);
        
        // Clear all content
        morphContentOptimized(container, '');
        expect(container.children.length).toBe(0);
        expect(getMorphStats(container).removed).toBe(1);
      });

      it('should handle single element', () => {
        morphContentOptimized(container, '<p>Single</p>');
        morphContentOptimized(container, '<p>Single</p>');
        
        expect(getMorphStats(container).skipped).toBe(1);
        expect(getMorphStats(container).updated).toBe(0);
      });

      it('should handle complete content replacement', () => {
        morphContentOptimized(container, '<p>A</p><p>B</p><p>C</p>');
        
        // Completely different content
        morphContentOptimized(container, '<h1>X</h1><h2>Y</h2>');
        
        const stats = getMorphStats(container);
        expect(stats.updated).toBe(2);
        expect(stats.removed).toBe(1);
        expect(stats.skipped).toBe(0);
      });

      it('should handle reordering (updates all)', () => {
        morphContentOptimized(container, '<p id="a">A</p><p id="b">B</p><p id="c">C</p>');
        
        // Reorder: all hashes at different positions = all updated
        morphContentOptimized(container, '<p id="c">C</p><p id="a">A</p><p id="b">B</p>');
        
        const stats = getMorphStats(container);
        expect(stats.updated).toBe(3);
        expect(stats.skipped).toBe(0);
      });

      it('should handle whitespace-only changes correctly', () => {
        const html1 = '<p>Text</p>';
        const html2 = '<p>Text </p>'; // trailing space
        
        morphContentOptimized(container, html1);
        morphContentOptimized(container, html2);
        
        // Should detect the change
        expect(getMorphStats(container).updated).toBe(1);
      });

      it('should handle attribute changes', () => {
        morphContentOptimized(container, '<div class="a">Content</div>');
        morphContentOptimized(container, '<div class="b">Content</div>');
        
        expect(getMorphStats(container).updated).toBe(1);
        expect(container.querySelector('div')?.className).toBe('b');
      });

      it('should reset state correctly', () => {
        morphContentOptimized(container, '<p>A</p><p>B</p>');
        
        const stats1 = getMorphStats(container);
        expect(stats1.added).toBe(2); // First time = all added
        
        resetElementMorphState(container);
        
        // After reset, same content should be "updated" (elements exist but hashes cleared)
        morphContentOptimized(container, '<p>A</p><p>B</p>');
        const stats2 = getMorphStats(container);
        expect(stats2.updated).toBe(2); // Hashes don't match (cleared), so "updated"
      });
    });

    describe('real-world markdown structures', () => {
      it('should handle heading hierarchy', () => {
        const doc = `
          <h1>Main Title</h1>
          <h2>Section 1</h2>
          <p>Content 1</p>
          <h2>Section 2</h2>
          <p>Content 2</p>
          <h3>Subsection 2.1</h3>
          <p>Content 2.1</p>
        `.trim();
        
        morphContentOptimized(container, doc);
        expect(container.children.length).toBe(7);
        
        morphContentOptimized(container, doc);
        expect(getMorphStats(container).skipped).toBe(7);
      });

      it('should handle task lists', () => {
        const tasks = `
          <ul class="task-list">
            <li><input type="checkbox" disabled> Task 1</li>
            <li><input type="checkbox" disabled checked> Task 2</li>
            <li><input type="checkbox" disabled> Task 3</li>
          </ul>
        `.trim();
        
        morphContentOptimized(container, tasks);
        expect(container.querySelectorAll('input[checked]').length).toBe(1);
        
        morphContentOptimized(container, tasks);
        expect(getMorphStats(container).skipped).toBe(1);
      });

      it('should handle definition lists', () => {
        const dl = `
          <dl>
            <dt>Term 1</dt>
            <dd>Definition 1</dd>
            <dt>Term 2</dt>
            <dd>Definition 2</dd>
          </dl>
        `.trim();
        
        morphContentOptimized(container, dl);
        expect(container.querySelectorAll('dt').length).toBe(2);
        
        morphContentOptimized(container, dl);
        expect(getMorphStats(container).skipped).toBe(1);
      });

      it('should handle footnotes structure', () => {
        const doc = `
          <p>Text with footnote<sup><a href="#fn1">[1]</a></sup></p>
          <hr>
          <section class="footnotes">
            <ol>
              <li id="fn1">Footnote content</li>
            </ol>
          </section>
        `.trim();
        
        morphContentOptimized(container, doc);
        expect(container.children.length).toBe(3);
        
        morphContentOptimized(container, doc);
        expect(getMorphStats(container).skipped).toBe(3);
      });

      it('should handle math blocks (KaTeX output)', () => {
        const math = `
          <p>The equation is:</p>
          <div class="math-display">
            <span class="katex">
              <span class="katex-mathml"><math><mi>E</mi><mo>=</mo><mi>m</mi><msup><mi>c</mi><mn>2</mn></msup></math></span>
              <span class="katex-html">E=mc²</span>
            </span>
          </div>
          <p>as shown above.</p>
        `.trim();
        
        morphContentOptimized(container, math);
        expect(container.querySelectorAll('.katex').length).toBe(1);
        
        morphContentOptimized(container, math);
        expect(getMorphStats(container).skipped).toBe(3);
      });

      it('should handle image with caption', () => {
        const fig = `
          <figure>
            <img src="image.png" alt="Description">
            <figcaption>Figure 1: An image</figcaption>
          </figure>
          <p>Following text</p>
        `.trim();
        
        morphContentOptimized(container, fig);
        
        // Update only the following text
        const fig2 = fig.replace('Following text', 'Updated text');
        morphContentOptimized(container, fig2);
        
        expect(getMorphStats(container).skipped).toBe(1); // figure unchanged
        expect(getMorphStats(container).updated).toBe(1); // paragraph changed
      });
    });

    describe('performance characteristics', () => {
      it('should maintain O(n) complexity for identical content', () => {
        // Create a large document
        const blocks = Array.from({ length: 100 }, (_, i) => 
          `<p>Paragraph ${i} with some content</p>`
        ).join('');
        
        morphContentOptimized(container, blocks);
        
        const start = performance.now();
        morphContentOptimized(container, blocks);
        const duration = performance.now() - start;
        
        // Should be very fast (< 10ms) for 100 blocks
        expect(duration).toBeLessThan(10);
        expect(getMorphStats(container).skipped).toBe(100);
      });

      it('should only morph the changing block in large documents', () => {
        // Create a large document
        const createBlocks = (middleContent: string) => 
          Array.from({ length: 50 }, (_, i) => 
            i === 25 ? `<p>${middleContent}</p>` : `<p>Paragraph ${i}</p>`
          ).join('');
        
        morphContentOptimized(container, createBlocks('Original middle'));
        morphContentOptimized(container, createBlocks('Changed middle'));
        
        expect(getMorphStats(container).updated).toBe(1);
        expect(getMorphStats(container).skipped).toBe(49);
      });
    });

    describe('multi-instance isolation', () => {
      let container2: HTMLDivElement;

      beforeEach(() => {
        container2 = document.createElement('div');
        container2.id = 'test-container-2';
        document.body.appendChild(container2);
      });

      afterEach(() => {
        container2.remove();
      });

      it('should maintain separate state for different containers', () => {
        // Container 1: Start with 3 paragraphs
        const content1 = '<p>Para 1</p><p>Para 2</p><p>Para 3</p>';
        morphContentOptimized(container, content1);
        
        // Container 2: Start with different content (2 headings)
        const content2 = '<h1>Heading 1</h1><h2>Heading 2</h2>';
        morphContentOptimized(container2, content2);
        
        // Container 1: Morph with same content - should skip all 3
        morphContentOptimized(container, content1);
        const stats1 = getMorphStats(container);
        
        expect(stats1.skipped).toBe(3);
        expect(stats1.updated).toBe(0);
        expect(stats1.added).toBe(0);
      });

      it('should not let container1 state affect container2 stats', () => {
        // Container 1: Create 5 paragraphs
        const content1 = '<p>A</p><p>B</p><p>C</p><p>D</p><p>E</p>';
        morphContentOptimized(container, content1);
        
        // Container 2: Create 2 divs
        const content2 = '<div>X</div><div>Y</div>';
        morphContentOptimized(container2, content2);
        const stats2 = getMorphStats(container2);
        
        // Container 2 should report its own stats (2 added), not affected by container 1
        expect(stats2.added).toBe(2);
        expect(stats2.skipped).toBe(0);
      });

      it('should correctly track skips per container in streaming simulation', () => {
        // Simulate two chat messages streaming simultaneously
        
        // Message 1 starts
        morphContentOptimized(container, '<p>Hello</p>');
        
        // Message 2 starts
        morphContentOptimized(container2, '<h1>Title</h1>');
        
        // Message 1 continues
        morphContentOptimized(container, '<p>Hello</p><p>World</p>');
        const stats1 = getMorphStats(container);
        
        // Message 1 should have skipped 1 (Hello), added 1 (World)
        expect(stats1.skipped).toBe(1);
        expect(stats1.added).toBe(1);
        
        // Message 2 continues
        morphContentOptimized(container2, '<h1>Title</h1><p>Content</p>');
        const stats2 = getMorphStats(container2);
        
        // Message 2 should have skipped 1 (Title), added 1 (Content)
        expect(stats2.skipped).toBe(1);
        expect(stats2.added).toBe(1);
      });

      it('should handle interleaved morphs correctly', () => {
        // Rapid interleaved updates between two containers
        morphContentOptimized(container, '<p>1</p>');
        morphContentOptimized(container2, '<p>A</p>');
        morphContentOptimized(container, '<p>1</p><p>2</p>');
        morphContentOptimized(container2, '<p>A</p><p>B</p>');
        morphContentOptimized(container, '<p>1</p><p>2</p><p>3</p>');
        morphContentOptimized(container2, '<p>A</p><p>B</p><p>C</p>');
        
        // Final state check - morph same content
        morphContentOptimized(container, '<p>1</p><p>2</p><p>3</p>');
        expect(getMorphStats(container).skipped).toBe(3);
        
        morphContentOptimized(container2, '<p>A</p><p>B</p><p>C</p>');
        expect(getMorphStats(container2).skipped).toBe(3);
      });
    });
  });
});
