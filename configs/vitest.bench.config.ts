import tsconfigPaths from 'vite-tsconfig-paths'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Benchmark-specific configuration
    include: ['**/*.bench.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/mocks/**'],
    benchmark: {
      include: ['**/*.bench.ts'],
    },
  },
  plugins: [tsconfigPaths()],
})
