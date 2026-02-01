// @ts-expect-error missing types for idiomorph
import Idiomorph from 'idiomorph/dist/idiomorph.cjs.js';
import { cacheManager } from './cache-manager';

// Use a simple hash for faster comparison than full string
function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return `${str.length}:${hash >>> 0}`;
}

// Shared Idiomorph configuration
const IDIOMORPH_OPTIONS = {
  morphStyle: 'innerHTML' as const,
  callbacks: {
    // This hook fires before Idiomorph deletes a node
    beforeNodeRemoved: (node: Node) => {
      // If the node has our special "ignore" attribute, return false to prevent removal
      if (node instanceof Element && node.hasAttribute('data-morph-ignore')) {
        return false;
      }
      return true;
    }
  }
};

// Track pending RAF to avoid stacking
let pendingMorph: number | null = null;
let pendingElement: Element | null = null;
let pendingHtml: string | null = null;

/**
 * Morph the content of an element using Idiomorph
 * Prevents full re-renders and preserves text selection
 * Uses requestAnimationFrame to batch updates and prevent jank
 */
export function morphContent(element: Element, newHtml: string): void {
  const newHash = simpleHash(newHtml);
  
  // Fast path: check hash in cache
  const cacheKey = 'morph:last';
  const lastHash = cacheManager.morphCache.get(cacheKey);
  
  if (lastHash === newHash) return;
  
  // Store for pending morph
  pendingElement = element;
  pendingHtml = newHtml;
  
  // Cancel any pending morph and schedule new one
  if (pendingMorph !== null) {
    cancelAnimationFrame(pendingMorph);
  }
  
  pendingMorph = requestAnimationFrame(() => {
    if (pendingElement && pendingHtml !== null) {
      // Update cache before morph
      cacheManager.morphCache.set(cacheKey, newHash);
      Idiomorph.morph(pendingElement, pendingHtml, IDIOMORPH_OPTIONS);
    }
    
    pendingMorph = null;
    pendingElement = null;
    pendingHtml = null;
  });
}

/**
 * Morph content synchronously (for cases where immediate update is needed)
 */
export function morphContentSync(element: Element, newHtml: string): void {
  const newHash = simpleHash(newHtml);
  const cacheKey = 'morph:last';
  const lastHash = cacheManager.morphCache.get(cacheKey);
  
  if (lastHash === newHash) return;
  
  cacheManager.morphCache.set(cacheKey, newHash);
  Idiomorph.morph(element, newHtml, IDIOMORPH_OPTIONS);
}

/**
 * Reset the morph cache (useful when switching content sources)
 */
export function resetMorphCache(): void {
  cacheManager.morphCache.clear();
  
  // Cancel any pending morph
  if (pendingMorph !== null) {
    cancelAnimationFrame(pendingMorph);
    pendingMorph = null;
  }
  pendingElement = null;
  pendingHtml = null;
}
