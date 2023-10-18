import { defineConfig } from '@kubb/core'

export type SwaggerPluginOptions = Kubb.OptionsPlugins

export default defineConfig(async () => {
  await setTimeout(() => {
    // wait for 1s, async behaviour
    return Promise.resolve(true)
  }, 1000)
  return {
    root: '.',
    input: {
      // path: './test.json',
      path: './petStore.yaml',
    },
    output: {
      path: './src/gen',
      clean: true,
    },
    hooks: {
      // done: ['npx eslint --fix ./src/gen', 'prettier --write "**/*.{ts,tsx}"', 'pnpm typecheck'],
    },
    plugins: [
      ['@kubb/swagger', { output: false, validate: true }],
      [
        '@kubb/swagger-ts',
        {
          output: 'models/ts',
          groupBy: {
            type: 'tag',
          },
          enumType: 'asPascalConst',
          dateType: 'date',
        },
      ],
      [
        '@kubb/swagger-tanstack-query',
        {
          output: './clients/hooks',
          skipBy: [
            {
              type: 'tag',
              pattern: 'store',
            },
          ],
          groupBy: { type: 'tag' },
          clientImportPath: '../../../../tanstack-query-client.ts',
          infinite: {},
          dataReturnType: 'full',
        },
      ],
      [
        '@kubb/swagger-swr',
        {
          output: './clients/swr',
          skipBy: [
            {
              type: 'tag',
              pattern: 'store',
            },
          ],
          groupBy: { type: 'tag' },
          clientImportPath: '../../../../swr-client.ts',
          dataReturnType: 'full',
        },
      ],
      [
        '@kubb/swagger-client',
        {
          output: './clients/axios',
          skipBy: [
            {
              type: 'tag',
              pattern: 'store',
            },
          ],
          groupBy: { type: 'tag', output: './clients/axios/{{tag}}Service' },
          clientImportPath: '../../../../axios-client.ts',
          dataReturnType: 'full',
          pathParamsType: 'object',
        },
      ],
      [
        '@kubb/swagger-zod',
        {
          output: './zod',
          skipBy: [
            {
              type: 'tag',
              pattern: 'store',
            },
          ],
          groupBy: { type: 'tag' },
        },
      ],
      [
        '@kubb/swagger-zodios',
        {
          output: 'zodios.ts',
        },
      ],
      [
        '@kubb/swagger-faker',
        {
          output: 'mocks',
          skipBy: [
            {
              type: 'tag',
              pattern: 'store',
            },
          ],
          groupBy: { type: 'tag' },
          dateType: 'date',
        },
      ],
      [
        '@kubb/swagger-msw',
        {
          output: 'msw',
          skipBy: [
            {
              type: 'tag',
              pattern: 'store',
            },
          ],
          groupBy: { type: 'tag' },
        },
      ],
    ],
  }
})
