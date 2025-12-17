import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    dir: './src',
    globals: true,
  },
  resolve: {
    alias: {
      '@kubb/core/utils': path.resolve(__dirname, '../core/dist/utils.js'),
    },
  },
})
