import { defineConfig } from '@kubb/core'
import { pluginClient } from '@kubb/plugin-client'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'

import * as client from './templates/client/index'

export default defineConfig(() => {
  return {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    hooks: {
      done: ['npm run typecheck', 'biome format --write ./', 'biome lint --apply-unsafe ./src'],
    },
    output: {
      path: './src/gen',
      clean: true,
    },
    plugins: [
      pluginOas({
        validate: false,
        experimentalFilter: {
          tags: ['store'],
        },
      }),
      pluginTs({
        output: { path: 'models/ts' },
        group: {
          type: 'tag',
        },
        enumType: 'asPascalConst',
        dateType: 'date',
      }),
      pluginClient({
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
                client: client.templates,
              },
            },
          },
        ],
      }),
    ],
  }
})
