import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    dir: './src',
    globals: false,
  },
  plugins: [tsconfigPaths()],
})
