import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    dir: './server',
    environment: 'node',
    testTimeout: 10000,
    globals: true,
  },
})
