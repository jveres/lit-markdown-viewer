import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isAtBottom,
  tryNativeSmoothScroll,
  cancelScrollAnimation,
  DEFAULT_MIN_DURATION,
  DEFAULT_MAX_DURATION,
  DEFAULT_SNAP_THRESHOLD,
  DEFAULT_AFTER_DELAY
} from '../../src/utils/animate-scroll';

// Mock element factory
const createMockElement = (overrides: Partial<Element> = {}): Element => {
  return {
    scrollTop: 0,
    scrollHeight: 1000,
    clientHeight: 500,
    isConnected: true,
    scrollTo: vi.fn(),
    ...overrides
  } as unknown as Element;
};

describe('animate-scroll utilities', () => {
  describe('constants', () => {
    it('should export correct default values', () => {
      expect(DEFAULT_MIN_DURATION).toBe(300);
      expect(DEFAULT_MAX_DURATION).toBe(600);
      expect(DEFAULT_SNAP_THRESHOLD).toBe(1);
      expect(DEFAULT_AFTER_DELAY).toBe(50);
    });
  });

  describe('isAtBottom', () => {
    it('should return true when scrolled to bottom', () => {
      const element = createMockElement({
        scrollTop: 500,
        scrollHeight: 1000,
        clientHeight: 500
      });
      
      expect(isAtBottom(element)).toBe(true);
    });

    it('should return true when within default threshold (50px)', () => {
      const element = createMockElement({
        scrollTop: 460, // 500 - 460 = 40px from bottom
        scrollHeight: 1000,
        clientHeight: 500
      });
      
      expect(isAtBottom(element)).toBe(true);
    });

    it('should return false when not at bottom', () => {
      const element = createMockElement({
        scrollTop: 0,
        scrollHeight: 1000,
        clientHeight: 500
      });
      
      expect(isAtBottom(element)).toBe(false);
    });

    it('should respect custom threshold', () => {
      const element = createMockElement({
        scrollTop: 400, // 100px from bottom
        scrollHeight: 1000,
        clientHeight: 500
      });
      
      expect(isAtBottom(element, 50)).toBe(false);
      expect(isAtBottom(element, 100)).toBe(true);
      expect(isAtBottom(element, 150)).toBe(true);
    });

    it('should return true when content fits without scrolling', () => {
      const element = createMockElement({
        scrollTop: 0,
        scrollHeight: 500,
        clientHeight: 500
      });
      
      expect(isAtBottom(element)).toBe(true);
    });

    it('should handle zero threshold', () => {
      const element = createMockElement({
        scrollTop: 500,
        scrollHeight: 1000,
        clientHeight: 500
      });
      
      expect(isAtBottom(element, 0)).toBe(true);
    });

    it('should return false when exactly at threshold boundary', () => {
      const element = createMockElement({
        scrollTop: 449, // 51px from bottom
        scrollHeight: 1000,
        clientHeight: 500
      });
      
      expect(isAtBottom(element, 50)).toBe(false);
    });
  });

  describe('tryNativeSmoothScroll', () => {
    it('should call scrollTo with smooth behavior', () => {
      const scrollToMock = vi.fn();
      const element = createMockElement({ scrollTo: scrollToMock });
      
      const result = tryNativeSmoothScroll(element, 100);
      
      expect(result).toBe(true);
      expect(scrollToMock).toHaveBeenCalledWith({ top: 100, behavior: 'smooth' });
    });

    it('should return false if scrollTo throws', () => {
      const element = createMockElement({
        scrollTo: vi.fn(() => { throw new Error('Not supported'); })
      });
      
      const result = tryNativeSmoothScroll(element, 100);
      
      expect(result).toBe(false);
    });
  });

  describe('cancelScrollAnimation', () => {
    it('should not throw when called on element with no active animation', () => {
      const element = createMockElement();
      
      expect(() => cancelScrollAnimation(element)).not.toThrow();
    });

    it('should be idempotent (safe to call multiple times)', () => {
      const element = createMockElement();
      
      cancelScrollAnimation(element);
      cancelScrollAnimation(element);
      cancelScrollAnimation(element);
      
      // Should not throw
      expect(true).toBe(true);
    });
  });
});

describe('animate-scroll animation functions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Note: Full animation tests require browser environment with requestAnimationFrame
  // These are better suited for component/integration tests with @vitest/browser
  
  describe('animateScrollTo (basic behavior)', () => {
    it('should be importable', async () => {
      const { animateScrollTo } = await import('../../src/utils/animate-scroll');
      expect(typeof animateScrollTo).toBe('function');
    });
  });

  describe('animateScrollToBottom (basic behavior)', () => {
    it('should be importable', async () => {
      const { animateScrollToBottom } = await import('../../src/utils/animate-scroll');
      expect(typeof animateScrollToBottom).toBe('function');
    });
  });
});
