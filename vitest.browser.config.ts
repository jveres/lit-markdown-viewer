import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  test: {
    include: ['tests/component/**/*.test.ts'],
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [
        { browser: 'chromium' }
      ],
      headless: true
    },
    coverage: {
      enabled: true,
      provider: 'istanbul',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage-browser',
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts', 'src/demo-page.ts', 'src/sample-markdown.ts']
    }
  }
});
