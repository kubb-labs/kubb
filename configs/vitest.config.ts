import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    exclude: ['**/node_modules/**', '**/dist/**', '**/mocks/**'],
    alias: {
      '@kubb/cli': 'packages/cli/src/index.ts',
      '@kubb/eslint-config': 'packages/config/eslint/src/index.ts',
      '@kubb/tsup-config': 'packages/config/tsup/src/index.ts',
      '@kubb/core/utils': 'packages/core/src/utils/index.ts',
      '@kubb/core': 'packages/core/src/index.ts',
      '@kubb/swagger/utils': 'packages/swagger/src/utils/index.ts',
      '@kubb/swagger/hooks': 'packages/swagger/src/hooks/index.ts',
      '@kubb/swagger': 'packages/swagger/src/index.ts',
      '@kubb/swagger-client': 'packages/swagger-client/src/index.ts',
      '@kubb/swagger-faker': 'packages/swagger-faker/src/index.ts',
      '@kubb/swagger-msw': 'packages/swagger-msw/src/index.ts',
      '@kubb/swagger-tanstack-query': 'packages/swagger-tanstack-query/src/index.ts',
      '@kubb/swagger-ts/hooks': 'packages/swagger-ts/src/hooks/index.ts',
      '@kubb/swagger-ts': 'packages/swagger-ts/src/index.ts',
      '@kubb/swagger-zod': 'packages/swagger-zod/src/index.ts',
      '@kubb/swagger-zodios': 'packages/swagger-zodios/src/index.ts',
      '@kubb/parser/factory': 'packages/parser/src/factory.ts',
      '@kubb/parser': 'packages/parser/src/index.ts',
      '@kubb/react/jsx-dev-runtime': 'packages/react/node_modules/react/jsx-dev-runtime.js',
      '@kubb/react': 'packages/react/src/index.ts',
    },
    coverage: {
      exclude: [
        '**/**/plugin.ts', // exclude because we have e2e
        'throttle', // TODO remove when we use an external library
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
