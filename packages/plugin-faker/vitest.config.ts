import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '#mocks': path.resolve(__dirname, '../..', 'configs/mocks.ts'),
    },
  },
  test: {
    dir: './src',
  },
})
