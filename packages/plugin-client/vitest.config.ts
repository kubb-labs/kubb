import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['./src/**/*.test.{ts,tsx}', './templates/**/*.test.{ts,tsx}'],
    globals: true,
  },
})
