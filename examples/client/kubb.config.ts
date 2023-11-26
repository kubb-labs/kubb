import { defineConfig } from '@kubb/core'

import { templates } from './templates/CustomClientTemplate'

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
          output: { path: 'models/ts' },
          group: {
            type: 'tag',
          },
          enumType: 'asPascalConst',
          dateType: 'date',
        },
      ],
      [
        '@kubb/swagger-client',
        {
          output: {
            path: './clients/axios',
          },
          exclude: [
            {
              type: 'tag',
              pattern: 'store',
            },
          ],
          group: { type: 'tag', output: './clients/axios/{{tag}}Service' },
          override: [
            {
              type: 'tag',
              pattern: 'user',
              options: {
                templates: {
                  client: templates,
                },
              },
            },
          ],
        },
      ],
    ],
  }
})
