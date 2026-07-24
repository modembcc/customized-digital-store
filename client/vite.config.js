import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Vitest's SSR transform doesn't pick up the oxc jsx config plugin-react sets for dev/build, so JSX in tests needs it here too.
  esbuild: process.env.VITEST ? { jsx: 'automatic' } : undefined,
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    globals: true,
  },
});
