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
      ['@kubb/swagger', { output: 'schemass', validate: true }],
      ['@kubb/swagger', { output: 'schemas2', validate: true }],
      [
        '@kubb/swagger-ts',
        {
          output: 'models/ts',
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
          output: './clients/hooks',
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
              },
            },
          ],
          group: { type: 'tag' },
          clientImportPath: '../../../../tanstack-query-client.ts',
          infinite: {},
          dataReturnType: 'full',
        },
      ],
      [
        '@kubb/swagger-swr',
        {
          output: './clients/swr',
          exclude: [
            {
              type: 'tag',
              pattern: 'store',
            },
          ],
          group: { type: 'tag' },
          clientImportPath: '../../../../swr-client.ts',
          dataReturnType: 'full',
        },
      ],
      [
        '@kubb/swagger-client',
        {
          output: './clients/axios',
          exclude: [
            {
              type: 'tag',
              pattern: 'store',
            },
          ],
          group: { type: 'tag', output: './clients/axios/{{tag}}Service' },
          clientImportPath: '../../../../axios-client.ts',
          dataReturnType: 'full',
          pathParamsType: 'object',
        },
      ],
      [
        '@kubb/swagger-zod',
        {
          output: './zod',
          exclude: [
            {
              type: 'tag',
              pattern: 'store',
            },
          ],
          group: { type: 'tag' },
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
          output: 'msw',
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
