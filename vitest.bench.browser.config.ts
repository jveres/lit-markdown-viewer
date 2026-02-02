import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  test: {
    include: ['tests/bench/morph.bench.ts'],
    benchmark: {
      include: ['tests/bench/morph.bench.ts'],
    },
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [
        { browser: 'chromium' }
      ],
      headless: true
    }
  }
});
