import tsconfigPaths from 'vite-tsconfig-paths'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    exclude: ['**/node_modules/**', '**/dist/**', '**/mocks/**'],
    coverage: {
      exclude: [
        '**/**/plugin.ts', // exclude because we have e2e
        'throttle', // TODO remove when we use an external library
        '**/dist/**',
        '**/mocks/**',
        '**/examples/**',
        '**/docs/**',
        '**/configs/**',
        '**/scripts/**',
        '**/index.ts',
        '**/types.ts',
        '**/jsx-runtime.ts',
        '**/bin/**',
        '**/packages/cli/**',
        '**/packages/config-biome/**',
        '**/packages/config-ts/**',
        '**/packages/config-tsup/**',
        '**/packages/kubb/**',
        '**/packages/swagger-ts/src/oas/**',
        '**/packages/plugin-client/client.ts',
        '**/e2e/**',
        '**/coverage/**',
        '**/__snapshots__/**',
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
  plugins: [tsconfigPaths()],
})
