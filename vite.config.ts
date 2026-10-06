/// <reference types="vitest/config" />

import {defineConfig} from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(() => ({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    https: {
      key: fs.readFileSync('./certs/localhost-key.pem'),
      cert: fs.readFileSync('./certs/localhost.pem'),
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src')
    }
  },
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
        '100': true
      }
    },
    css: false,
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.test.ts?(x)'],
    setupFiles: 'src/test-setup.ts'
  },
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
}))
