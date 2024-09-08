// import '@kubb/react/devtools' // enable/disable devtools

import { defineConfig } from '@kubb/core'
import transformers from '@kubb/core/transformers'
import { pluginClient } from '@kubb/plugin-client'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'

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
        enumType: 'asConst',
        dateType: 'date',
      }),
      pluginClient({
        output: {
          path: './clients',
        },
        exclude: [
          {
            type: 'tag',
            pattern: 'store',
          },
        ],
        group: { type: 'tag', output: './clients/axios/{{tag}}Service' },
        operations: true,
        pathParamsType: 'object',
      }),
      pluginClient({
        output: {
          path: './tagObject.ts',
          exportType: false,
        },
        include: [
          {
            type: 'tag',
            pattern: 'store',
          },
        ],
        dataReturnType: 'full',
        pathParamsType: 'object',
      }),
      pluginClient({
        output: {
          path: './tag.ts',
          exportType: false,
        },
        parser: 'client',
        include: [
          {
            type: 'tag',
            pattern: 'store',
          },
        ],
        transformers: {
          name(name, type) {
            if (type === 'function') {
              return transformers.camelCase(`${name} controller`)
            }

            return name
          },
        },
      }),
    ],
  }
})
