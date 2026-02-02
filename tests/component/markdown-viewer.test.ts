import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import '../../src/components/markdown-viewer/markdown-viewer';
import type { MarkdownViewer } from '../../src/components/markdown-viewer/markdown-viewer';
import { preloadKaTeX } from '../../src/components/markdown-viewer/parser';

// Helper to create and mount a component
async function createComponent(props: { text?: string; isStreaming?: boolean; tabindex?: string; className?: string } = {}): Promise<MarkdownViewer> {
  const el = document.createElement('markdown-viewer') as MarkdownViewer;
  
  if (props.text !== undefined) el.text = props.text;
  if (props.isStreaming !== undefined) el.isStreaming = props.isStreaming;
  if (props.tabindex !== undefined) el.setAttribute('tabindex', props.tabindex);
  if (props.className !== undefined) el.className = props.className;
  
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

describe('markdown-viewer component', () => {
  afterEach(() => {
    // Cleanup all markdown-viewer elements
    document.querySelectorAll('markdown-viewer').forEach(el => el.remove());
  });

  describe('rendering', () => {
    it('should render empty when no text provided', async () => {
      const el = await createComponent();
      const markdown = el.shadowRoot?.querySelector('.markdown');
      expect(markdown).toBeTruthy();
    });

    it('should render plain text as paragraph', async () => {
      const el = await createComponent({ text: 'Hello world' });
      
      const markdown = el.shadowRoot?.querySelector('.markdown');
      expect(markdown?.innerHTML).toContain('<p>');
      expect(markdown?.innerHTML).toContain('Hello world');
    });

    it('should render headings', async () => {
      const el = await createComponent({ text: '# Heading 1' });
      
      const h1 = el.shadowRoot?.querySelector('h1');
      expect(h1).toBeTruthy();
      expect(h1?.textContent).toContain('Heading 1');
    });

    it('should render code blocks with copy button', async () => {
      const el = await createComponent({ text: '```\ncode\n```' });
      
      const copyBtn = el.shadowRoot?.querySelector('.copy-btn');
      expect(copyBtn).toBeTruthy();
    });

    it('should render tables wrapped in table-wrapper', async () => {
      const markdown = '| A | B |\n|---|---|\n| 1 | 2 |';
      const el = await createComponent({ text: markdown });
      
      const wrapper = el.shadowRoot?.querySelector('.table-wrapper');
      expect(wrapper).toBeTruthy();
      const table = el.shadowRoot?.querySelector('table');
      expect(table).toBeTruthy();
    });
  });

  describe('attributes and properties', () => {
    it('should auto-set tabindex for focusability', async () => {
      const el = await createComponent();
      expect(el.getAttribute('tabindex')).toBe('0');
    });

    it('should not override existing tabindex', async () => {
      const el = await createComponent({ tabindex: '-1' });
      expect(el.getAttribute('tabindex')).toBe('-1');
    });

    it('should apply dark class for dark theme', async () => {
      const el = await createComponent({ text: 'test', className: 'dark' });
      expect(el.classList.contains('dark')).toBe(true);
    });
  });

  describe('streaming mode', () => {
    it('should show cursor when streaming', async () => {
      const el = await createComponent({ text: 'Hello', isStreaming: true });
      
      const cursor = el.shadowRoot?.querySelector('#cursor');
      expect(cursor).toBeTruthy();
    });

    it('should not show cursor when not streaming', async () => {
      const el = await createComponent({ text: 'Hello', isStreaming: false });
      
      const cursor = el.shadowRoot?.querySelector('#cursor');
      expect(cursor).toBeFalsy();
    });

    it('should auto-focus when streaming starts', async () => {
      const el = await createComponent({ text: '' });
      
      // Start streaming
      el.isStreaming = true;
      el.text = 'Hello';
      await el.updateComplete;
      
      expect(document.activeElement).toBe(el);
    });
  });

  describe('focus and cursor styling', () => {
    it('should be focusable', async () => {
      const el = await createComponent({ text: 'Hello' });
      
      el.focus();
      expect(document.activeElement).toBe(el);
    });

    it('should lose focus on blur', async () => {
      const el = await createComponent({ text: 'Hello' });
      
      el.focus();
      expect(document.activeElement).toBe(el);
      
      el.blur();
      expect(document.activeElement).not.toBe(el);
    });
  });

  describe('reset method', () => {
    it('should clear internal state on reset', async () => {
      const el = await createComponent({ text: 'Hello', isStreaming: true });
      
      el.reset();
      
      // The text property is not cleared by reset, only internal caches
      expect(el.text).toBe('Hello');
    });
  });

  describe('copy functionality', () => {
    it('should have copy button in code blocks', async () => {
      const el = await createComponent({ text: '```js\nconst x = 1;\n```' });
      
      const copyBtn = el.shadowRoot?.querySelector('.copy-btn');
      expect(copyBtn).toBeTruthy();
      expect(copyBtn?.getAttribute('aria-label')).toBe('Copy code');
    });
  });

  describe('math rendering', () => {
    // Preload KaTeX before math tests (lazy loaded)
    beforeAll(async () => {
      await preloadKaTeX();
    });

    it('should render inline math', async () => {
      const el = await createComponent({ text: '$x^2$' });
      
      const katex = el.shadowRoot?.querySelector('.katex');
      expect(katex).toBeTruthy();
    });

    it('should render display math', async () => {
      const el = await createComponent({ text: '$$x^2$$' });
      
      const katex = el.shadowRoot?.querySelector('.katex-display');
      expect(katex).toBeTruthy();
    });
  });
});
