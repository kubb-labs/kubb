import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['./src/**/*.test.{ts,tsx}', './templates/**/*.test.{ts,tsx}'],
  },
  plugins: [tsconfigPaths()],
})
