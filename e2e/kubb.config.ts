import { defineConfig } from '@kubb/core'

/**
 * @link https://apis.guru/
 */

export default defineConfig(() => {
  return {
    root: '.',
    input: {
      path: 'https://petstore3.swagger.io/api/v3/openapi.json',
    },
    output: {
      path: './src/gen',
      clean: true,
    },
    hooks: {
      done: ['pnpm typecheck'],
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
        },
      ],
      ['@kubb/swagger-tanstack-query', { output: './clients/hooks', groupBy: { type: 'tag' } }],
      ['@kubb/swagger-swr', { output: './clients/swr', groupBy: { type: 'tag' } }],
      ['@kubb/swagger-client', { output: './clients/axios', groupBy: { type: 'tag', output: './clients/axios/{{tag}}Service' } }],
      ['@kubb/swagger-zod', { output: './zod', groupBy: { type: 'tag' } }],
      ['@kubb/swagger-zodios', { output: 'zodios.ts' }],
      ['@kubb/swagger-faker', { output: 'mocks', groupBy: { type: 'tag' } }],
    ],
  }
})
