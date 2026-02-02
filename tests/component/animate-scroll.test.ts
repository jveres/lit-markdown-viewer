import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  animateScrollTo,
  animateScrollToBottom,
  cancelScrollAnimation,
  isAtBottom
} from '../../src/utils/animate-scroll';

describe('animate-scroll (browser)', () => {
  let container: HTMLDivElement;
  let content: HTMLDivElement;

  beforeEach(() => {
    // Create a scrollable container
    container = document.createElement('div');
    container.style.cssText = 'height: 200px; overflow: auto;';
    
    content = document.createElement('div');
    content.style.height = '1000px'; // Make content taller than container
    content.textContent = 'Scrollable content';
    
    container.appendChild(content);
    document.body.appendChild(container);
  });

  afterEach(() => {
    cancelScrollAnimation(container);
    container.remove();
  });

  describe('animateScrollTo', () => {
    it('should scroll to target position', async () => {
      const targetScroll = 300;
      
      await animateScrollTo(container, targetScroll, {
        minDuration: 50,
        maxDuration: 100,
        afterDelay: 0
      });
      
      expect(container.scrollTop).toBe(targetScroll);
    });

    it('should snap immediately when distance is below threshold', async () => {
      container.scrollTop = 100;
      
      await animateScrollTo(container, 100, {
        snapThreshold: 5,
        afterDelay: 0
      });
      
      expect(container.scrollTop).toBe(100);
    });

    it('should clamp target to max scroll', async () => {
      const maxScroll = container.scrollHeight - container.clientHeight;
      
      await animateScrollTo(container, 99999, {
        minDuration: 50,
        maxDuration: 100,
        afterDelay: 0
      });
      
      expect(container.scrollTop).toBe(maxScroll);
    });

    it('should clamp target to min scroll (0)', async () => {
      container.scrollTop = 100;
      
      await animateScrollTo(container, -100, {
        minDuration: 50,
        maxDuration: 100,
        afterDelay: 0
      });
      
      expect(container.scrollTop).toBe(0);
    });

    it('should apply offset to target', async () => {
      await animateScrollTo(container, 200, {
        offset: 50,
        minDuration: 50,
        maxDuration: 100,
        afterDelay: 0
      });
      
      expect(container.scrollTop).toBe(250);
    });

    it('should cancel previous animation on same element', async () => {
      // Start first animation
      const promise1 = animateScrollTo(container, 500, {
        minDuration: 500,
        maxDuration: 500,
        afterDelay: 0
      });
      
      // Immediately start second animation (should cancel first)
      const promise2 = animateScrollTo(container, 100, {
        minDuration: 50,
        maxDuration: 100,
        afterDelay: 0
      });
      
      await Promise.all([promise1, promise2]);
      
      // Should end at second target
      expect(container.scrollTop).toBe(100);
    });

    it('should respect abort signal', async () => {
      const controller = new AbortController();
      
      const promise = animateScrollTo(container, 500, {
        minDuration: 500,
        maxDuration: 500,
        afterDelay: 0,
        signal: controller.signal
      });
      
      // Abort immediately
      controller.abort();
      
      await promise;
      
      // Should not have scrolled (or very little)
      expect(container.scrollTop).toBeLessThan(100);
    });

    it('should handle already aborted signal', async () => {
      const controller = new AbortController();
      controller.abort();
      
      await animateScrollTo(container, 500, {
        minDuration: 50,
        maxDuration: 100,
        afterDelay: 0,
        signal: controller.signal
      });
      
      // Should resolve immediately without scrolling
      expect(container.scrollTop).toBe(0);
    });

    it('should resolve when element is disconnected', async () => {
      const promise = animateScrollTo(container, 500, {
        minDuration: 500,
        maxDuration: 500,
        afterDelay: 0
      });
      
      // Remove element during animation
      container.remove();
      
      await promise;
      
      // Should resolve without error
      expect(true).toBe(true);
    });

    it('should wait afterDelay before resolving', async () => {
      const start = Date.now();
      
      await animateScrollTo(container, 0, {
        snapThreshold: 1000, // Will snap immediately
        afterDelay: 100
      });
      
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some timing tolerance
    });
  });

  describe('animateScrollToBottom', () => {
    it('should scroll to bottom', async () => {
      const maxScroll = container.scrollHeight - container.clientHeight;
      
      await animateScrollToBottom(container, {
        minDuration: 50,
        maxDuration: 100,
        afterDelay: 0
      });
      
      expect(container.scrollTop).toBe(maxScroll);
    });

    it('should snap when already at bottom', async () => {
      const maxScroll = container.scrollHeight - container.clientHeight;
      container.scrollTop = maxScroll;
      
      await animateScrollToBottom(container, {
        snapThreshold: 5,
        afterDelay: 0
      });
      
      expect(container.scrollTop).toBe(maxScroll);
    });

    it('should use dynamic target when enabled', async () => {
      await animateScrollToBottom(container, {
        dynamicTarget: true,
        minDuration: 50,
        maxDuration: 100,
        afterDelay: 0
      });
      
      const maxScroll = container.scrollHeight - container.clientHeight;
      expect(container.scrollTop).toBe(maxScroll);
    });

    it('should handle content growth with dynamic target', async () => {
      const promise = animateScrollToBottom(container, {
        dynamicTarget: true,
        minDuration: 200,
        maxDuration: 300,
        afterDelay: 0
      });
      
      // Grow content during animation
      setTimeout(() => {
        content.style.height = '1500px';
      }, 50);
      
      await promise;
      
      // Should be at the new bottom
      const maxScroll = container.scrollHeight - container.clientHeight;
      expect(container.scrollTop).toBe(maxScroll);
    });

    it('should coalesce rapid calls with dynamic target', async () => {
      // First call
      const promise1 = animateScrollToBottom(container, {
        dynamicTarget: true,
        minDuration: 100,
        maxDuration: 200,
        afterDelay: 0
      });
      
      // Second call while first is running - should be coalesced
      const promise2 = animateScrollToBottom(container, {
        dynamicTarget: true,
        minDuration: 100,
        maxDuration: 200,
        afterDelay: 0
      });
      
      await Promise.all([promise1, promise2]);
      
      const maxScroll = container.scrollHeight - container.clientHeight;
      expect(container.scrollTop).toBe(maxScroll);
    });
  });

  describe('cancelScrollAnimation', () => {
    it('should stop ongoing animation', async () => {
      const promise = animateScrollTo(container, 500, {
        minDuration: 500,
        maxDuration: 500,
        afterDelay: 0
      });
      
      // Wait a bit then cancel
      await new Promise(r => setTimeout(r, 50));
      cancelScrollAnimation(container);
      
      await promise;
      
      // Should have stopped before reaching target
      expect(container.scrollTop).toBeLessThan(500);
    });

    it('should be safe to call on element without animation', () => {
      expect(() => cancelScrollAnimation(container)).not.toThrow();
    });

    it('should be idempotent', () => {
      cancelScrollAnimation(container);
      cancelScrollAnimation(container);
      cancelScrollAnimation(container);
      
      expect(true).toBe(true);
    });
  });

  describe('isAtBottom', () => {
    it('should return true when at bottom', () => {
      const maxScroll = container.scrollHeight - container.clientHeight;
      container.scrollTop = maxScroll;
      
      expect(isAtBottom(container)).toBe(true);
    });

    it('should return true when within threshold', () => {
      const maxScroll = container.scrollHeight - container.clientHeight;
      container.scrollTop = maxScroll - 30;
      
      expect(isAtBottom(container, 50)).toBe(true);
    });

    it('should return false when above threshold', () => {
      container.scrollTop = 0;
      
      expect(isAtBottom(container)).toBe(false);
    });

    it('should return true when content fits without scrolling', () => {
      content.style.height = '100px'; // Shorter than container
      
      expect(isAtBottom(container)).toBe(true);
    });
  });
});
