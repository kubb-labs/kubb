// import '@kubb/react/devtools' // enable/disable devtools

import { defineConfig } from '@kubb/core'
import transformers from '@kubb/core/transformers'
import { pluginClient } from '@kubb/plugin-client'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { clientOperationGenerator } from './src/generators/clientOperationGenerator'
import { clientOperationReactGenerator } from './src/generators/clientOperationReactGenerator'
import { clientStaticGenerator } from './src/generators/clientStaticGenerator'

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
      extension: {
        '.ts': '.js',
      },
    },
    plugins: [
      pluginOas({
        validate: false,
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
          path: './clients/axios',
          banner: '/* eslint-disable no-alert, no-console */',
        },
        exclude: [
          {
            type: 'tag',
            pattern: 'store',
          },
        ],
        group: {
          type: 'tag',
          name({ group }) {
            return `${group}Service`
          },
        },
        operations: true,
        pathParamsType: 'object',
      }),
      pluginClient({
        output: {
          path: './tagObject.ts',
        },
        generators: [clientStaticGenerator],
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
          path: './tagClientOperation.ts',
        },
        generators: [clientOperationGenerator],
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
          path: './tagClientOperationReact.ts',
        },
        generators: [clientOperationReactGenerator],
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
