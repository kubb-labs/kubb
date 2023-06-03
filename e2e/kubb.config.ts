import { defineConfig } from '@kubb/core'

export default defineConfig(() => {
  return {
    root: '.',
    input: {
      path: './schemas/petStore.yaml',
    },
    output: {
      path: './gen',
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
    ],
  }
})
