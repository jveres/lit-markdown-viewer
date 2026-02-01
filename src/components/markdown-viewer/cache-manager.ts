/**
 * Unified LRU Cache Manager
 * Coordinates memory usage across all caches in the markdown-viewer
 */

export interface CacheConfig {
  maxEntries: number;
  maxTotalBytes?: number;
}

export interface CacheStats {
  entries: number;
  estimatedBytes: number;
}

class LRUCache<V> {
  private cache = new Map<string, V>();
  private sizeEstimates = new Map<string, number>();
  private totalBytes = 0;
  private maxEntries: number;
  private maxBytes: number;

  constructor(maxEntries: number, maxBytes: number = Infinity) {
    this.maxEntries = maxEntries;
    this.maxBytes = maxBytes;
  }

  get(key: string): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: string, value: V, sizeBytes?: number): void {
    // If key exists, remove old size
    if (this.cache.has(key)) {
      this.totalBytes -= this.sizeEstimates.get(key) ?? 0;
      this.cache.delete(key);
      this.sizeEstimates.delete(key);
    }

    // Estimate size if not provided
    const size = sizeBytes ?? this.estimateSize(value);

    // Evict if needed
    while (
      (this.cache.size >= this.maxEntries || this.totalBytes + size > this.maxBytes) &&
      this.cache.size > 0
    ) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.totalBytes -= this.sizeEstimates.get(firstKey) ?? 0;
        this.cache.delete(firstKey);
        this.sizeEstimates.delete(firstKey);
      }
    }

    this.cache.set(key, value);
    this.sizeEstimates.set(key, size);
    this.totalBytes += size;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
    this.sizeEstimates.clear();
    this.totalBytes = 0;
  }

  evictOldest(count: number): void {
    const keys = this.cache.keys();
    for (let i = 0; i < count; i++) {
      const { value: key, done } = keys.next();
      if (done || !key) break;
      this.totalBytes -= this.sizeEstimates.get(key) ?? 0;
      this.cache.delete(key);
      this.sizeEstimates.delete(key);
    }
  }

  get stats(): CacheStats {
    return {
      entries: this.cache.size,
      estimatedBytes: this.totalBytes
    };
  }

  private estimateSize(value: V): number {
    if (typeof value === 'string') {
      return value.length * 2; // UTF-16
    }
    return 100; // Default estimate for objects
  }
}

// Total memory budget: ~10MB default
const DEFAULT_MEMORY_BUDGET = 10 * 1024 * 1024;

/**
 * Global cache manager instance
 * Coordinates memory across render cache, katex cache, and morph cache
 */
class CacheManager {
  private memoryBudget: number;

  // Individual caches with allocated budgets
  // Separate render caches for sync/async strategies (avoids key concatenation)
  readonly renderCacheSync: LRUCache<string>;
  readonly renderCacheAsync: LRUCache<string>;
  // Separate KaTeX caches for display/inline modes (avoids key concatenation)
  readonly katexCacheDisplay: LRUCache<string>;
  readonly katexCacheInline: LRUCache<string>;
  readonly morphCache: LRUCache<string>;

  constructor(memoryBudget = DEFAULT_MEMORY_BUDGET) {
    this.memoryBudget = memoryBudget;

    // Allocate budget: 25% render sync, 25% render async, 20% katex display, 20% katex inline, 10% morph
    this.renderCacheSync = new LRUCache<string>(100, memoryBudget * 0.25);
    this.renderCacheAsync = new LRUCache<string>(100, memoryBudget * 0.25);
    this.katexCacheDisplay = new LRUCache<string>(250, memoryBudget * 0.2);
    this.katexCacheInline = new LRUCache<string>(250, memoryBudget * 0.2);
    this.morphCache = new LRUCache<string>(10, memoryBudget * 0.1);
  }

  /**
   * Get combined stats for all caches
   */
  get stats(): { renderSync: CacheStats; renderAsync: CacheStats; katexDisplay: CacheStats; katexInline: CacheStats; morph: CacheStats; total: CacheStats } {
    const renderSync = this.renderCacheSync.stats;
    const renderAsync = this.renderCacheAsync.stats;
    const katexDisplay = this.katexCacheDisplay.stats;
    const katexInline = this.katexCacheInline.stats;
    const morph = this.morphCache.stats;

    return {
      renderSync,
      renderAsync,
      katexDisplay,
      katexInline,
      morph,
      total: {
        entries: renderSync.entries + renderAsync.entries + katexDisplay.entries + katexInline.entries + morph.entries,
        estimatedBytes: renderSync.estimatedBytes + renderAsync.estimatedBytes + katexDisplay.estimatedBytes + katexInline.estimatedBytes + morph.estimatedBytes
      }
    };
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.renderCacheSync.clear();
    this.renderCacheAsync.clear();
    this.katexCacheDisplay.clear();
    this.katexCacheInline.clear();
    this.morphCache.clear();
  }

  /**
   * Trim caches if under memory pressure
   * Evicts ~25% of entries from each cache when budget exceeded
   */
  trimIfNeeded(): void {
    const { total } = this.stats;
    if (total.estimatedBytes > this.memoryBudget * 0.9) {
      // Evict oldest entries by clearing and letting natural re-population occur
      // This is simpler than surgical eviction and works well for LRU caches
      const caches = [
        this.renderCacheSync,
        this.renderCacheAsync,
        this.katexCacheDisplay,
        this.katexCacheInline,
        this.morphCache
      ];

      for (const cache of caches) {
        const targetEvictions = Math.ceil(cache.stats.entries * 0.25);
        cache.evictOldest(targetEvictions);
      }
    }
  }
}

// Singleton instance
export const cacheManager = new CacheManager();

// Export types for external use
export type { LRUCache };
