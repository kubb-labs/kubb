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
      done: ['npx eslint --fix ./src/gen', 'pnpm typecheck'],
    },
    // logLevel: 'info',
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
      ['@kubb/swagger-tanstack-query', { output: './clients/hooks', groupBy: { type: 'tag' }, client: './src/client.ts' }],
      ['@kubb/swagger-swr', { output: './clients/swr', groupBy: { type: 'tag' }, client: './src/client.ts' }],
      ['@kubb/swagger-client', { output: './clients/axios', groupBy: { type: 'tag', output: './clients/axios/{{tag}}Service' }, client: './src/client.ts' }],
      ['@kubb/swagger-zod', { output: './zod', groupBy: { type: 'tag' } }],
      ['@kubb/swagger-zodios', { output: 'zodios.ts' }],
      // ['@kubb/swagger-faker', { output: 'mocks' }],
    ],
  }
})
