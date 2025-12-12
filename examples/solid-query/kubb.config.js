import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginSolidQuery } from '@kubb/plugin-solid-query'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
    format: 'biome',
    lint: 'biome',
  },
  hooks: {
    done: ['npm run typecheck'],
  },
  plugins: [
    pluginOas({
      generators: [],
    }),
    pluginTs({
      output: { path: 'models' },
    }),
    pluginSolidQuery({
      client: {
        bundle: true,
      },
      output: {
        path: './hooks',
      },
      query: false,
      override: [
        {
          type: 'operationId',
          pattern: 'findPetsByTags',
          options: {
            client: {
              dataReturnType: 'full',
              client: 'axios',
            },
            infinite: {
              queryParam: 'pageSize',
              initialPageParam: 0,
              cursorParam: undefined,
            },
          },
        },
        {
          type: 'operationId',
          pattern: 'updatePetWithForm',
          options: {
            query: {
              importPath: '@tanstack/solid-query',
              key: (key) => key,
              methods: ['post'],
            },
            pathParamsType: 'inline',
          },
        },
      ],
    }),
  ],
})
