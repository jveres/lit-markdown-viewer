export interface CursorBlinkOptions {
  blinkEnabled?: boolean;
  blinkSpeed?: number; // Seconds
  blinkDelay?: number; // Seconds
}

const DEFAULT_OPTIONS: Required<CursorBlinkOptions> = {
  blinkEnabled: true,
  blinkSpeed: 1.0,
  blinkDelay: 1.0
};

export function createCursorController(options: CursorBlinkOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };

  // Time to wait after typing stops before blinking resumes.
  // Set to 500ms to prevent flickering between keystrokes.
  const IDLE_TIMEOUT_MS = 500;

  let activeTimer: number | null = null;
  let isBlinkAlt = false; // Tracks toggle state in memory to avoid DOM reads
  let currentContainer: HTMLElement | null = null;

  const initConfig = (el: HTMLElement) => {
    el.style.setProperty('--cursor-blink-name', 'cursor-blink');
    el.style.setProperty(
      '--cursor-blink-duration',
      config.blinkEnabled ? `${config.blinkSpeed.toFixed(2)}s` : '0s'
    );
    el.style.setProperty('--cursor-blink-delay', `${config.blinkDelay.toFixed(2)}s`);
  };

  // Forces the CSS animation to restart at 0% (visible)
  const resetBlinkAnimation = (el: HTMLElement): void => {
    isBlinkAlt = !isBlinkAlt;
    el.style.setProperty('--cursor-blink-name', isBlinkAlt ? 'cursor-blink-' : 'cursor-blink');
  };

  const update = (container: HTMLElement): void => {
    // Update container reference and init if changed
    if (container !== currentContainer) {
      currentContainer = container;
      initConfig(container);
    }

    const cursor = container.querySelector('#cursor') as HTMLElement | null;
    if (!cursor) return;

    // 1. Clear existing timer to keep cursor solid
    if (activeTimer) {
      clearTimeout(activeTimer);
      activeTimer = null;
    }

    // 2. Reset the animation cycle so it starts fully visible
    resetBlinkAnimation(container);

    // 3. Make cursor "active" (solid/non-blinking via CSS)
    cursor.classList.add('cursor-active');

    // 4. Set timeout to resume blinking after user stops typing
    activeTimer = window.setTimeout(() => {
      if (cursor.isConnected) {
        cursor.classList.remove('cursor-active');
      }
      activeTimer = null;
    }, IDLE_TIMEOUT_MS);
  };

  const reset = (): void => {
    if (activeTimer) {
      clearTimeout(activeTimer);
      activeTimer = null;
    }
    if (currentContainer) {
      const cursor = currentContainer.querySelector('#cursor') as HTMLElement | null;
      cursor?.classList.remove('cursor-active');
    }
  };

  const destroy = (): void => {
    reset();
    if (currentContainer) {
      currentContainer.style.removeProperty('--cursor-blink-name');
      currentContainer.style.removeProperty('--cursor-blink-duration');
      currentContainer.style.removeProperty('--cursor-blink-delay');
    }
    currentContainer = null;
  };

  return { update, reset, destroy };
}

export type CursorController = ReturnType<typeof createCursorController>;
