import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginClient } from '@kubb/plugin-client'
import { pluginTs } from '@kubb/plugin-ts'

import * as client from './templates/client/index'

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
    hooks: {
      done: ['npm run typecheck', 'sleep 10', 'pnpm run build'],
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
