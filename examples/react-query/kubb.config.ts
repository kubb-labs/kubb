import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { QueryKey } from '@kubb/plugin-react-query/components'
import { pluginTs } from '@kubb/plugin-ts'

/** @type {import('@kubb/core').UserConfig} */
export const config = {
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
    defaultBanner: 'simple' as const,
  },
  hooks: {
    done: ['npm run typecheck', 'biome format --write ./', 'biome lint --fix --unsafe ./src'],
  },
  plugins: [
    pluginOas({ generators: [] }),
    pluginTs({
      output: {
        path: 'models',
        banner(oas) {
          return `// version: ${oas.api.info.version}`
        },
      },
    }),
    pluginReactQuery({
      bundle: true,
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
      group: {
        type: 'path',
      },
      queryKey(props) {
        const keys = QueryKey.getTransformer(props)
        return ['"v5"', ...keys]
      },
      paramsType: 'inline',
      pathParamsType: 'object',
      suspense: {},
      override: [
        {
          type: 'operationId',
          pattern: 'findPetsByTags',
          options: {
            client: {
              dataReturnType: 'full',
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
          pattern: 'getInventory',
          options: {
            query: false,
          },
        },
        {
          type: 'operationId',
          pattern: 'updatePetWithForm',
          options: {
            query: {
              importPath: '@tanstack/react-query',
              methods: ['post'],
            },
            mutation: {
              importPath: '@tanstack/react-query',
              methods: ['put', 'delete'],
            },
            pathParamsType: 'inline',
          },
        },
      ],
    }),
  ],
}

export default defineConfig(config)
