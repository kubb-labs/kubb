import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tsconfigPaths from 'vite-tsconfig-paths'

import { defineConfig } from 'vitest/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@kubb/utils': path.resolve(__dirname, '../packages/utils/src/index.ts'),
    },
  },
  test: {
    include: ['**/*.bench.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/mocks/**'],
    benchmark: {
      include: ['**/*.bench.ts'],
    },
  },
  plugins: [tsconfigPaths()],
})
