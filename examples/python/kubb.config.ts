import { defineConfig } from '@kubb/core'

import { templates } from './templates/CustomClientTemplate'

export default defineConfig(async () => {
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
        '@kubb/swagger-client',
        {
          output: {
            path: './',
            exportType: false,
          },
          group: { type: 'tag', output: './{{tag}}Service' },
          templates: {
            client: templates,
            operations: false,
          },
        },
      ],
    ],
  }
})
