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
  },
  hooks: {
    done: ['npm run typecheck', 'biome format --write ./', 'biome lint --apply-unsafe ./src'],
  },
  plugins: [
    pluginOas({
      output: false,
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
              importPath: '@kubb/plugin-client/client',
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
