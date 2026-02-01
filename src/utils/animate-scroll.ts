// Define utility types
export type EasingFunction = (t: number) => number;

export interface ScrollToOptions {
    minDuration?: number;
    maxDuration?: number;
    snapThreshold?: number;
    offset?: number;
    afterDelay?: number;
    signal?: AbortSignal;
    easing?: EasingFunction;
}

export interface ScrollToBottomOptions extends ScrollToOptions {
    /** If true, recalculate target each frame to handle content growth */
    dynamicTarget?: boolean;
}

export const DEFAULT_MIN_DURATION = 300;
export const DEFAULT_MAX_DURATION = 600;
export const DEFAULT_SNAP_THRESHOLD = 1;
export const DEFAULT_AFTER_DELAY = 50;

/**
 * Calculate scroll duration based on distance.
 * Attempts to match native browser smooth scroll timing:
 * - Chrome/Safari use ~500ms for most distances
 * - Scales slightly with distance but stays in reasonable range
 */
const calculateDuration = (distance: number, minDuration: number, maxDuration: number): number => {
    // Base duration ~400ms, scales gently with distance
    // log scaling keeps long distances from taking too long
    const scaled = minDuration + Math.min(Math.log10(distance + 1) * 100, maxDuration - minDuration);
    return Math.min(maxDuration, Math.max(minDuration, scaled));
};

/**
 * Attempt using native smooth scroll behavior.
 * Returns true if successful, false if not supported or failed.
 */
export const tryNativeSmoothScroll = (element: Element, top: number): boolean => {
    try {
        element.scrollTo({ top, behavior: 'smooth' });
        return true;
    } catch {
        return false;
    }
};

/**
 * Cubic bezier implementation for custom easing curves.
 * Attempt using native smooth scroll behavior.
 */
const cubicBezier = (p1x: number, p1y: number, p2x: number, p2y: number): EasingFunction => {
    // Newton-Raphson iteration to find t for given x
    const sampleCurveX = (t: number) => ((1 - 3 * p2x + 3 * p1x) * t + (3 * p2x - 6 * p1x)) * t * t + 3 * p1x * t;
    const sampleCurveY = (t: number) => ((1 - 3 * p2y + 3 * p1y) * t + (3 * p2y - 6 * p1y)) * t * t + 3 * p1y * t;
    const sampleCurveDerivativeX = (t: number) => (3 * (1 - 3 * p2x + 3 * p1x) * t + 2 * (3 * p2x - 6 * p1x)) * t + 3 * p1x;

    const solveCurveX = (x: number): number => {
        let t = x;
        for (let i = 0; i < 8; i++) {
            const currentX = sampleCurveX(t) - x;
            if (Math.abs(currentX) < 1e-6) return t;
            const derivative = sampleCurveDerivativeX(t);
            if (Math.abs(derivative) < 1e-6) break;
            t -= currentX / derivative;
        }
        return t;
    };

    return (x: number): number => {
        if (x === 0 || x === 1) return x;
        return sampleCurveY(solveCurveX(x));
    };
};

/**
 * Browser-like ease curve: cubic-bezier(0.25, 0.1, 0.25, 1.0)
 * This matches the CSS 'ease' timing function used by native smooth scroll.
 */
const browserEase = cubicBezier(0.25, 0.1, 0.25, 1.0);

const defaultEase: EasingFunction = browserEase;

// WeakMap ensures that if the DOM element is removed, memory is freed automatically.
const activeAnimations = new WeakMap<Element, AbortController>();
const activeBottomAnimations = new WeakSet<Element>();

export const animateScrollTo = (
    element: Element,
    to: number,
    options: ScrollToOptions = {}
): Promise<void> => {
    const {
        minDuration = DEFAULT_MIN_DURATION,
        maxDuration = DEFAULT_MAX_DURATION,
        snapThreshold = DEFAULT_SNAP_THRESHOLD,
        offset = 0,
        afterDelay = DEFAULT_AFTER_DELAY,
        signal: userSignal,
        easing = defaultEase
    } = options;

    const settleAndResolve = (resolve: () => void) => {
        if (afterDelay > 0) {
            setTimeout(resolve, afterDelay);
        } else {
            resolve();
        }
    };

    // Cancel any previous animation running on this specific element
    const currentController = activeAnimations.get(element);
    if (currentController) {
        currentController.abort();
    }

    // Create a new internal controller for this specific animation run
    const internalController = new AbortController();
    activeAnimations.set(element, internalController);
    const { signal } = internalController;

    // Optional: If the user passed an external signal, listen to it
    if (userSignal) {
        if (userSignal.aborted) {
            internalController.abort();
        } else {
            userSignal.addEventListener('abort', () => internalController.abort(), {
                once: true,
                signal // bind listener lifetime to our internal signal
            });
        }
    }

    return new Promise((resolve) => {
        if (signal.aborted || !element.isConnected) {
            return resolve();
        }

        // Get start position and calculate target with bounds clamping
        const start = element.scrollTop;
        const maxScroll = element.scrollHeight - element.clientHeight;
        const target = Math.max(0, Math.min(maxScroll, to + offset));
        const distance = Math.abs(target - start);

        if (distance <= snapThreshold) {
            element.scrollTop = target;
            activeAnimations.delete(element); // Cleanup
            return settleAndResolve(resolve);
        }

        const duration = calculateDuration(distance, minDuration, maxDuration);
        const startTime = performance.now();

        const tick = () => {
            // Check internal signal (triggered by new calls or user abort)
            if (signal.aborted) {
                return resolve();
            }

            if (!element.isConnected) {
                activeAnimations.delete(element);
                return resolve();
            }

            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Formula: position = start + (totalChange × easedProgress)
            element.scrollTop = start + (target - start) * easing(progress);

            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                element.scrollTop = target;
                // Only delete if WE are still the active controller
                if (activeAnimations.get(element) === internalController) {
                    activeAnimations.delete(element);
                }
                settleAndResolve(resolve);
            }
        };

        requestAnimationFrame(tick);
    });
};

/**
 * Scroll to bottom with dynamic target support.
 * When dynamicTarget is true, recalculates the bottom position each frame
 * to handle content that grows during the animation (e.g., image loads).
 */
export const animateScrollToBottom = (
    element: Element,
    options: ScrollToBottomOptions = {}
): Promise<void> => {
    const {
        minDuration = DEFAULT_MIN_DURATION,
        maxDuration = DEFAULT_MAX_DURATION,
        snapThreshold = DEFAULT_SNAP_THRESHOLD,
        afterDelay = DEFAULT_AFTER_DELAY,
        signal: userSignal,
        easing = defaultEase,
        dynamicTarget = false
    } = options;

    // For non-dynamic, use the simpler animateScrollTo
    if (!dynamicTarget) {
        const maxScroll = element.scrollHeight - element.clientHeight;
        return animateScrollTo(element, maxScroll, options);
    }

    // If already animating to bottom with dynamic target, let it continue
    // (dynamic target will handle content growth)
    if (activeBottomAnimations.has(element)) {
        return Promise.resolve();
    }

    const settleAndResolve = (resolve: () => void) => {
        if (afterDelay > 0) {
            setTimeout(resolve, afterDelay);
        } else {
            resolve();
        }
    };

    const cleanup = () => {
        activeBottomAnimations.delete(element);
        if (activeAnimations.get(element) === internalController) {
            activeAnimations.delete(element);
        }
    };

    // Cancel any previous non-bottom animation
    const currentController = activeAnimations.get(element);
    if (currentController) {
        currentController.abort();
    }

    const internalController = new AbortController();
    activeAnimations.set(element, internalController);
    activeBottomAnimations.add(element);
    const { signal } = internalController;

    if (userSignal) {
        if (userSignal.aborted) {
            internalController.abort();
        } else {
            userSignal.addEventListener('abort', () => internalController.abort(), {
                once: true,
                signal
            });
        }
    }

    return new Promise((resolve) => {
        if (signal.aborted || !element.isConnected) {
            cleanup();
            return resolve();
        }

        const start = element.scrollTop;
        const initialTarget = element.scrollHeight - element.clientHeight;
        const initialDistance = Math.abs(initialTarget - start);

        if (initialDistance <= snapThreshold) {
            element.scrollTop = initialTarget;
            cleanup();
            return settleAndResolve(resolve);
        }

        // Calculate duration based on initial distance
        const duration = calculateDuration(initialDistance, minDuration, maxDuration);
        const startTime = performance.now();

        const tick = () => {
            if (signal.aborted) {
                cleanup();
                return resolve();
            }

            if (!element.isConnected) {
                cleanup();
                return resolve();
            }

            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easing(progress);

            // Dynamic target: recalculate bottom each frame
            const currentTarget = element.scrollHeight - element.clientHeight;
            
            // Interpolate from start to current target
            element.scrollTop = start + (currentTarget - start) * easedProgress;

            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                // Snap to final bottom position
                element.scrollTop = element.scrollHeight - element.clientHeight;
                cleanup();
                settleAndResolve(resolve);
            }
        };

        requestAnimationFrame(tick);
    });
};

/**
 * Cancel any active scroll animation on an element
 */
export const cancelScrollAnimation = (element: Element): void => {
    const controller = activeAnimations.get(element);
    if (controller) {
        controller.abort();
        activeAnimations.delete(element);
    }
    activeBottomAnimations.delete(element);
};

/**
 * Check if an element is scrolled to the bottom (within threshold)
 */
export const isAtBottom = (element: Element, threshold = 50): boolean => {
    const { scrollTop, scrollHeight, clientHeight } = element;
    return scrollHeight - scrollTop - clientHeight <= threshold;
};
