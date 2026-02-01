import { defineConfig } from 'vite';

export default defineConfig({
  base: '/lit-markdown-viewer/',
  build: {
    target: 'esnext',
  },
  optimizeDeps: {
    exclude: ['@nick/comrak'],
  },
  server: {
    // Force full reload for WASM modules to prevent memory issues
    hmr: {
      overlay: true,
    },
  },
});
