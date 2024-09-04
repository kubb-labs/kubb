import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginTs } from '@kubb/plugin-ts'

import * as mutation from './templates/mutate/index'
import * as queryKey from './templates/queryKey/index'

/** @type {import('@kubb/core').UserConfig} */
export const config = {
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
  plugins: [
    pluginOas({ generators: [] }),
    pluginTs({
      output: {
        path: 'models',
      },
    }),
    pluginReactQuery({
      transformers: {
        name: (name, type) => {
          if (type === 'file' || type === 'function') {
            return `${name}Hook`
          }
          return name
        },
      },
      output: {
        path: './hooks',
      },
      query: {
        queryKey: (keys) => ['"v5"', ...keys],
      },
      suspense: {},
      override: [
        {
          type: 'operationId',
          pattern: 'findPetsByTags',
          options: {
            dataReturnType: 'full',
            infinite: {
              queryParam: 'pageSize',
              initialPageParam: 0,
              cursorParam: undefined,
            },
            templates: {
              queryKey: queryKey.templates,
            },
          },
        },
        {
          type: 'operationId',
          pattern: 'updatePetWithForm',
          options: {
            query: {
              queryKey: (key: unknown[]) => key,
              methods: ['post'],
            },
          },
        },
      ],
      templates: {
        mutation: mutation.templates,
      },
    }),
  ],
}

export default defineConfig(config)
