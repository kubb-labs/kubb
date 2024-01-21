import { defineConfig } from '@kubb/core'
import createSwagger from '@kubb/swagger'
import createSwaggerTanstackQuery from '@kubb/swagger-tanstack-query'
import createSwaggerTS from '@kubb/swagger-ts'

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
  hooks: {
    // done: ['prettier --write "**/*.{ts,tsx}"', 'eslint --fix ./src/gen'],
  },
  plugins: [
    createSwagger({ output: false }),
    createSwaggerTS({
      output: {
        path: 'models',
      },
    }),
    createSwaggerTanstackQuery({
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
      framework: 'react',
      suspense: {},
      override: [{
        type: 'operationId',
        pattern: 'findPetsByTags',
        options: {
          dataReturnType: 'full',
          infinite: {
            queryParam: 'pageSize',
            initialPageParam: 0,
            cursorParam: undefined,
          },
        },
      }],
    }),
  ],
}

export default defineConfig(config)
