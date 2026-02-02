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
  resetElementMorphState();
  
  // Cancel any pending morph
  if (pendingMorph !== null) {
    cancelAnimationFrame(pendingMorph);
    pendingMorph = null;
  }
  pendingElement = null;
  pendingHtml = null;
}

// --------------------------------------------------------------------------
// Element-Level Optimized Morphing (Option A: Hybrid approach)
// --------------------------------------------------------------------------

/** Previous element hashes for diff comparison */
let prevElementHashes: string[] = [];

/** Stats for debugging */
let lastMorphStats = { updated: 0, skipped: 0, added: 0, removed: 0 };

/**
 * Get last morph stats (for debugging/logging)
 */
export function getMorphStats() {
  return lastMorphStats;
}

/**
 * Optimized morph that skips unchanged elements
 * 
 * Strategy:
 * 1. Parse new HTML into temp container
 * 2. Hash each top-level element
 * 3. Compare with previous hashes
 * 4. Only morph elements that changed
 * 
 * @param container The container element to morph
 * @param newHtml The new HTML content
 * @returns true if any elements were updated
 */
export function morphContentOptimized(container: Element, newHtml: string): boolean {
  // Parse new HTML into temp container
  const temp = document.createElement('div');
  temp.innerHTML = newHtml;
  
  const newHashes: string[] = [];
  const stats = { updated: 0, skipped: 0, added: 0, removed: 0 };
  
  const oldLen = container.children.length;
  const newLen = temp.children.length;
  const maxLen = Math.max(oldLen, newLen);
  
  // Process each element position
  for (let i = 0; i < maxLen; i++) {
    const oldChild = container.children[i];
    const newChild = temp.children[i];
    
    if (!newChild && oldChild) {
      // Element removed - will handle after loop to avoid index shifting
      continue;
    }
    
    if (!newChild) continue;
    
    const newHash = simpleHash(newChild.outerHTML);
    newHashes.push(newHash);
    
    if (!oldChild) {
      // New element - append (clone since temp will be discarded)
      container.appendChild(newChild.cloneNode(true));
      stats.added++;
    } else if (prevElementHashes[i] !== newHash) {
      // Element changed - morph it
      Idiomorph.morph(oldChild, newChild.outerHTML, {
        morphStyle: 'outerHTML' as const,
        callbacks: IDIOMORPH_OPTIONS.callbacks
      });
      stats.updated++;
    } else {
      // Element unchanged - skip!
      stats.skipped++;
    }
  }
  
  // Remove extra elements from the end (if any)
  while (container.children.length > newLen) {
    container.lastElementChild?.remove();
    stats.removed++;
  }
  
  prevElementHashes = newHashes;
  lastMorphStats = stats;
  
  return stats.updated > 0 || stats.added > 0 || stats.removed > 0;
}

/**
 * Reset element-level morph state
 */
export function resetElementMorphState(): void {
  prevElementHashes = [];
  lastMorphStats = { updated: 0, skipped: 0, added: 0, removed: 0 };
}
