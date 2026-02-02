import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { morphContent, morphContentSync, resetMorphCache } from '../../src/components/markdown-viewer/morph';
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
    resetMorphCache();
  });

  afterEach(() => {
    container.remove();
    resetMorphCache();
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
    it('should clear the morph cache', () => {
      morphContentSync(container, '<p>Content</p>');
      
      // Cache should have the hash
      expect(cacheManager.morphCache.stats.entries).toBeGreaterThan(0);
      
      resetMorphCache();
      
      // Cache should be empty
      expect(cacheManager.morphCache.stats.entries).toBe(0);
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
      resetMorphCache();
      
      // Now morph should work
      morphContentSync(container, html);
      expect(container.innerHTML).toBe('<p>Content</p>');
    });

    it('should cancel pending async morph', async () => {
      morphContent(container, '<p>Pending</p>');
      
      // Reset before RAF fires
      resetMorphCache();
      
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      // Pending morph should have been cancelled
      expect(container.innerHTML).toBe('');
    });
  });

  describe('hash collision handling', () => {
    it('should morph different content with same length', () => {
      // Different content, same length
      morphContentSync(container, '<p>AAAA</p>');
      expect(container.innerHTML).toBe('<p>AAAA</p>');
      
      // Reset to clear cache
      resetMorphCache();
      
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
});
