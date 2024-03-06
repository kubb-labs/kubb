import { defineConfig } from '@kubb/core'

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
      ['@kubb/swagger', {
        output: {
          path: 'schemas',
        },
        validate: true,
      }],
      ['@kubb/swagger', {
        output: {
          path: 'schemas2',
        },
        validate: true,
      }],
      [
        '@kubb/swagger-ts',
        {
          output: {
            path: 'models/ts',
            extName: '.js',
          },
          group: {
            type: 'tag',
          },
          enumType: 'asPascalConst',
          dateType: 'date',
          override: [
            {
              type: 'operationId',
              pattern: 'findPetsByStatus',
              options: {
                enumType: 'enum',
              },
            },
          ],
        },
      ],
      [
        '@kubb/swagger-tanstack-query',
        {
          output: {
            path: './clients/hooks',
            exportAs: 'hooks',
          },
          exclude: [
            {
              type: 'tag',
              pattern: 'store',
            },
          ],
          override: [
            {
              type: 'tag',
              pattern: 'pet',
              options: {
                infinite: {
                  queryParam: 'test',
                },
                mutate: {
                  variablesType: 'mutate',
                },
              },
            },
          ],
          group: { type: 'tag' },
          client: {
            importPath: '../../../../tanstack-query-client.ts',
          },
          infinite: {},
          dataReturnType: 'full',
          parser: 'zod',
        },
      ],
      [
        '@kubb/swagger-swr',
        {
          output: {
            path: './clients/swr',
            exportAs: 'swrHooks',
          },
          exclude: [
            {
              type: 'tag',
              pattern: 'store',
            },
          ],
          group: { type: 'tag' },
          client: {
            importPath: '../../../../swr-client.ts',
          },
          dataReturnType: 'full',
        },
      ],
      [
        '@kubb/swagger-client',
        {
          output: {
            path: './clients/axios',
            exportAs: 'clients',
          },
          exclude: [
            {
              type: 'tag',
              pattern: 'store',
            },
          ],
          group: { type: 'tag', output: './clients/axios/{{tag}}Service' },
          client: {
            importPath: '../../../../axios-client.ts',
          },
          dataReturnType: 'full',
          pathParamsType: 'object',
        },
      ],
      [
        '@kubb/swagger-zod',
        {
          output: {
            path: './zod',
            exportAs: 'zod',
          },
          exclude: [
            {
              type: 'tag',
              pattern: 'store',
            },
          ],
          group: { type: 'tag' },
          dateType: 'date',
          typed: true,
        },
      ],
      [
        '@kubb/swagger-zodios',
        {
          output: {
            path: 'zodios.ts',
            exportAs: 'zodios',
          },
        },
      ],
      [
        '@kubb/swagger-faker',
        {
          output: {
            path: 'mocks',
            exportAs: 'faker',
          },
          exclude: [
            {
              type: 'tag',
              pattern: 'store',
            },
          ],
          group: { type: 'tag' },
          dateType: 'date',
        },
      ],
      [
        '@kubb/swagger-msw',
        {
          output: {
            path: 'msw',
            exportAs: 'msw',
          },
          exclude: [
            {
              type: 'tag',
              pattern: 'store',
            },
          ],
          group: { type: 'tag' },
        },
      ],
    ],
  }
})
