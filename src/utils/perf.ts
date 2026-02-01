/**
 * Performance metrics logging for development mode
 */

const isDev = import.meta.env?.DEV ?? true;

interface PerfStats {
  count: number;
  total: number;
  min: number;
  max: number;
  avg: number;
  last: number;
}

const activeTimers = new Map<string, number>();
const stats = new Map<string, PerfStats>();

/**
 * Start a performance timer
 */
export const perfStart = (name: string): void => {
  if (!isDev) return;
  activeTimers.set(name, performance.now());
};

/**
 * End a performance timer and log the result
 */
export const perfEnd = (name: string, threshold = 0): number => {
  if (!isDev) return 0;
  
  const start = activeTimers.get(name);
  if (start === undefined) return 0;
  
  const duration = performance.now() - start;
  activeTimers.delete(name);
  
  // Update stats
  let stat = stats.get(name);
  if (!stat) {
    stat = { count: 0, total: 0, min: Infinity, max: 0, avg: 0, last: 0 };
    stats.set(name, stat);
  }
  
  stat.count++;
  stat.total += duration;
  stat.min = Math.min(stat.min, duration);
  stat.max = Math.max(stat.max, duration);
  stat.avg = stat.total / stat.count;
  stat.last = duration;
  
  // Log if above threshold
  if (duration >= threshold) {
    const color = duration > 16 ? '#ff6b6b' : duration > 8 ? '#ffd93d' : '#6bcb77';
    console.log(
      `%c⏱ ${name}%c ${duration.toFixed(2)}ms`,
      'color: #888; font-weight: normal',
      `color: ${color}; font-weight: bold`
    );
  }
  
  return duration;
};

/**
 * Measure a function execution time
 */
export const perfMeasure = <T>(name: string, fn: () => T, threshold = 0): T => {
  if (!isDev) return fn();
  
  perfStart(name);
  const result = fn();
  perfEnd(name, threshold);
  return result;
};

/**
 * Measure an async function execution time
 */
export const perfMeasureAsync = async <T>(
  name: string,
  fn: () => Promise<T>,
  threshold = 0
): Promise<T> => {
  if (!isDev) return fn();
  
  perfStart(name);
  const result = await fn();
  perfEnd(name, threshold);
  return result;
};

/**
 * Log current stats for all tracked metrics
 */
export const perfStats = (): void => {
  if (!isDev) return;
  
  console.group('%c📊 Performance Stats', 'color: #4ecdc4; font-weight: bold');
  
  const entries = Array.from(stats.entries()).sort((a, b) => b[1].total - a[1].total);
  
  console.table(
    Object.fromEntries(
      entries.map(([name, s]) => [
        name,
        {
          count: s.count,
          avg: `${s.avg.toFixed(2)}ms`,
          min: `${s.min.toFixed(2)}ms`,
          max: `${s.max.toFixed(2)}ms`,
          total: `${s.total.toFixed(2)}ms`,
        },
      ])
    )
  );
  
  console.groupEnd();
};

/**
 * Reset all stats
 */
export const perfReset = (): void => {
  if (!isDev) return;
  stats.clear();
  activeTimers.clear();
  console.log('%c🔄 Performance stats reset', 'color: #888');
};

/**
 * Create a scoped performance logger
 */
export const createPerfLogger = (prefix: string) => ({
  start: (name: string) => perfStart(`${prefix}:${name}`),
  end: (name: string, threshold = 0) => perfEnd(`${prefix}:${name}`, threshold),
  measure: <T>(name: string, fn: () => T, threshold = 0) => 
    perfMeasure(`${prefix}:${name}`, fn, threshold),
  measureAsync: <T>(name: string, fn: () => Promise<T>, threshold = 0) =>
    perfMeasureAsync(`${prefix}:${name}`, fn, threshold),
});

// Expose to window for console access in dev
if (isDev && typeof window !== 'undefined') {
  (window as any).__perf = {
    stats: perfStats,
    reset: perfReset,
  };
  console.log(
    '%c🔧 Dev mode: Performance metrics enabled. Use __perf.stats() to view, __perf.reset() to clear.',
    'color: #888; font-style: italic'
  );
}
