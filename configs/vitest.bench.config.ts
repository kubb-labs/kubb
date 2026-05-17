import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    include: ['**/*.bench.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/mocks/**'],
    benchmark: {
      include: ['**/*.bench.ts'],
    },
  },
})
