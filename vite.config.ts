/// <reference types="vitest/config" />

import fs from 'node:fs';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

export default defineConfig(({command}) => ({
  build: { outDir: 'docs' },
  css: {
    api: 'modern-compiler',
    preprocessorOptions: {
      scss: {
        additionalData: `
          @use "@/assets/scss/variables.scss" as *;
        `,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  // certs/ is git-ignored, so the production build (GitHub Pages on CI) must not read it
  server:
    command === 'serve'
      ? {
          https: {
            cert: fs.readFileSync('./certs/localhost.pem'),
            key: fs.readFileSync('./certs/localhost-key.pem'),
          },
        }
      : {},
  test: {
    bail: 1,
    clearMocks: true,
    coverage: {
      enabled: true,
      exclude: ['src/main.tsx', 'src/mocks/browser.ts'],
      include: ['src/**/*'],
      reporter: ['text', 'lcov'],
      reportsDirectory: 'coverage',
      thresholds: {
        '100': true,
      },
    },
    css: false,
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.test.ts?(x)'],
    setupFiles: 'src/testSetup.ts',
  },
}));
