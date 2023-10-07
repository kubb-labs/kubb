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
          client: './src/client.ts',
        },
      ],
    ],
  }
})
