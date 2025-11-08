import path from 'node:path'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    tsconfigPaths({
      projects: [path.resolve(__dirname, '../../tsconfig.json')],
    }),
  ],
  resolve: {
    alias: {
      '@kubb/core/utils': path.resolve(__dirname, '../core/src/utils/index.ts'),
    },
  },
  test: {
    dir: './src',
    globals: true,
  },
})
