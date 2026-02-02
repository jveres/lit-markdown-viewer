# Performance Improvement Strategy

> Last updated: 2026-02-02
> Baseline established with Vitest benchmarks

## Current Baseline

### Parser Performance (Node)

| Content Type | Size | Mean | Ops/sec | Notes |
|--------------|------|------|---------|-------|
| Paragraphs (small) | ~1KB | 0.019ms | 52,304 | ✅ Fast |
| Code blocks (small) | ~1KB | 0.013ms | 78,000 | ✅ Fast |
| Mixed (medium) | ~5KB | 0.39ms | 2,545 | ✅ Good |
| Math/KaTeX (medium) | ~10KB | 0.64ms | 1,551 | ⚠️ Slowest |
| Mixed (large) | ~18KB | 1.70ms | 590 | ⚠️ Monitor |
| Tables (stress) | ~45KB | 16.1ms | 62 | 🔴 Bottleneck |
| Cache hit | any | 0.27ms | 3,680 | ✅ Effective |

### Morph Performance (Browser/Chromium)

| Operation | Mean | Ops/sec | Notes |
|-----------|------|---------|-------|
| Initial render (small) | 0.03ms | 36,070 | ✅ Fast |
| Initial render (medium) | 0.21ms | 4,789 | ✅ Good |
| Initial render (large) | 0.81ms | 1,238 | ⚠️ Monitor |
| 20 incremental morphs | 5.35ms | 187 | ⚠️ ~0.27ms/morph |
| Hash skip (no change) | 0.22ms | 4,496 | ✅ Effective |
| Append content | 0.14ms | 7,122 | ✅ Fast |

### Observed Issues (from demo at ~90% streaming)

```
markdown:morph fluctuations: 14-19ms normal, spikes to 25-35ms
markdown:parse stable: ~5ms
```

Spikes likely caused by:
- GC pauses (large string allocations)
- Large DOM tree diffing
- Complex content (tables, KaTeX math)

---

## Identified Bottlenecks

### 1. KaTeX Math Rendering
- **Impact:** 12x slower than code blocks
- **Cause:** Complex LaTeX parsing and DOM generation
- **Frequency:** Every parse with math content

### 2. Table Rendering at Scale
- **Impact:** 47x slower than code at stress size
- **Cause:** Many cells = many DOM nodes to create/diff
- **Frequency:** Documents with large tables

### 3. Morph with Large DOM
- **Impact:** Linear scaling, spikes at ~90% content
- **Cause:** Idiomorph diffing entire tree
- **Frequency:** Every streaming update

### 4. GC Pressure
- **Impact:** 10-20ms spikes
- **Cause:** String allocations, DOM node creation
- **Frequency:** Periodic, unpredictable

---

## Improvement Strategies

### Priority 1: Quick Wins (Low effort, measurable impact)

#### 1.1 Adaptive Throttling
- **Current:** Fixed `throttle-ms` (default 32ms)
- **Proposal:** Increase throttle as content grows
- **Implementation:**
  ```typescript
  // Pseudocode
  const baseThrottle = 32;
  const contentLength = markdown.length;
  const adaptiveThrottle = baseThrottle + Math.floor(contentLength / 10000) * 16;
  ```
- **Expected:** Fewer morphs at large content = smoother UX
- **Effort:** Low

#### 1.2 KaTeX Caching Improvement
- **Current:** Cache by math expression string
- **Proposal:** Pre-warm cache for common expressions
- **Implementation:** LRU cache with larger size for KaTeX
- **Expected:** 20-30% improvement for math-heavy content
- **Effort:** Low

#### 1.3 Debounce Final Updates
- **Current:** Same update rate throughout streaming
- **Proposal:** Debounce more aggressively near end (>80%)
- **Expected:** Reduce spikes at end of streaming
- **Effort:** Low

### Priority 2: Medium Effort (Significant impact)

#### 2.1 Incremental Parsing
- **Current:** Re-parse entire content on each update
- **Proposal:** Track last parsed position, only parse new content
- **Challenge:** Markdown context can change (e.g., unclosed code block)
- **Implementation:** 
  - Detect stable boundaries (completed blocks)
  - Cache parsed HTML up to boundary
  - Only re-parse from last stable point
- **Expected:** 50-70% reduction in parse time for streaming
- **Effort:** Medium

#### 2.2 Morph Optimization: Subtree Targeting
- **Current:** Morph entire container
- **Proposal:** Identify changed subtree, morph only that
- **Implementation:**
  - Compare content hashes per top-level block
  - Only morph blocks that changed
- **Expected:** 30-50% reduction in morph time
- **Effort:** Medium

#### 2.3 Virtual Scrolling for Large Content
- **Current:** Render all content
- **Proposal:** Only render visible content + buffer
- **Challenge:** Complex with variable-height blocks
- **Expected:** Constant performance regardless of content size
- **Effort:** Medium-High

### Priority 3: Advanced Optimizations

#### 3.1 Web Worker for Parsing
- **Current:** Parse on main thread
- **Proposal:** Move Comrak (WASM) to worker
- **Challenge:** Worker communication overhead
- **Expected:** Unblock main thread during heavy parsing
- **Effort:** High

#### 3.2 Streaming HTML Generation
- **Current:** Generate complete HTML, then morph
- **Proposal:** Stream HTML chunks directly to DOM
- **Challenge:** Requires parser modifications
- **Expected:** Lower memory, faster TTFB
- **Effort:** High

#### 3.3 Table Virtualization
- **Current:** Render all table rows
- **Proposal:** Virtual scroll within tables
- **Expected:** Constant performance for large tables
- **Effort:** High

---

## Measurement Plan

### Before Any Change
```bash
npm run bench          # Parser baseline
npm run bench:browser  # Morph baseline
```

### After Each Change
1. Run benchmarks
2. Compare with baseline
3. Update this document with results

### Key Metrics to Track

| Metric | Target | Current |
|--------|--------|---------|
| Parse (medium) | <0.3ms | 0.39ms |
| Parse (large) | <1.5ms | 1.70ms |
| KaTeX (medium) | <0.5ms | 0.64ms |
| Morph (medium) | <0.15ms | 0.21ms |
| Morph (large) | <0.5ms | 0.81ms |
| Streaming (20 morphs) | <4ms | 5.35ms |
| Max spike (observed) | <20ms | 35ms |

---

## Implementation Order

### Phase 1: Quick Wins
- [x] 1.1 Adaptive throttling ✅ (2026-02-02)
- [ ] 1.2 KaTeX cache tuning
- [ ] 1.3 Debounce at end of stream

### Phase 2: Core Optimizations
- [ ] 2.1 Incremental parsing
- [ ] 2.2 Subtree morph targeting

### Phase 3: Advanced (if needed)
- [ ] 2.3 Virtual scrolling
- [ ] 3.1 Web Worker parsing
- [ ] 3.2 Streaming HTML
- [ ] 3.3 Table virtualization

---

## Results Log

### Baseline (2026-02-02)
- Parser benchmarks: See table above
- Morph benchmarks: See table above
- Demo observation: Spikes 25-35ms at 90% content

### Adaptive Throttling (2026-02-02)
- **Implementation:** Morph-time based throttle adjustment
- **Algorithm:** Target 25% morph budget, 30% smoothing, 50-200ms range
- **Normal CPU results:**
  - Throttle: 50ms → 62ms at end
  - Max morph: 22ms (down from 35ms baseline)
  - Spikes eliminated
- **6x CPU throttle results:**
  - Throttle: 50ms → 200ms (max)
  - Max morph: 137ms
  - Avg morph: 35ms
  - Streaming remained smooth despite slow device

### [Future entries will be added here]

---

## Commands Reference

```bash
# Run parser benchmarks
npm run bench

# Run morph benchmarks (browser)
npm run bench:browser

# Run with JSON output for comparison
npm run bench -- --outputJson baseline.json
npm run bench -- --outputJson after-change.json --compare baseline.json

# Watch mode during development
npm run bench:watch
```

---

## Related Files

- `tests/bench/parser.bench.ts` - Parser benchmarks
- `tests/bench/morph.bench.ts` - Morph benchmarks
- `vitest.bench.browser.config.ts` - Browser benchmark config
- `src/components/markdown-viewer/parser.ts` - Parser implementation
- `src/components/markdown-viewer/morph.ts` - Morph implementation
- `src/components/markdown-viewer/cache-manager.ts` - Caching layer
