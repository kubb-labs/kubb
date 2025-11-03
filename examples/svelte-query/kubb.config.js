import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginSvelteQuery } from '@kubb/plugin-svelte-query'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
    defaultBanner: 'full',
  },
  hooks: {
    done: ['npm run typecheck', 'biome format --write ./', 'biome lint --fix --unsafe ./src'],
  },
  plugins: [
    pluginOas({
      generators: [],
    }),
    pluginTs({
      output: { path: 'models' },
    }),
    pluginSvelteQuery({
      output: {
        path: './hooks',
      },
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
            paramsCasing: 'camelcase',
            query: {
              importPath: '@tanstack/svelte-query',
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
