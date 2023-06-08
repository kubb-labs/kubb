import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      exclude: [
        '**/plugin.ts', // exclude because we have e2e
        '**/dist/**',
        '**/mocks/**',
        '**/coverage/**',
        '**/packages/*/test?(s)/**',
        '**/*.d.ts',
        'test?(s)/**',
        'test?(-*).?(c|m)[jt]s?(x)',
        '**/*{.,-}{test,spec}.?(c|m)[jt]s?(x)',
        '**/__tests__/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
        '**/.{eslint,mocha,prettier}rc.{?(c|m)js,yml}',
      ],
    },
  },
})
