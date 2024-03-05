import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerTanstackQuery } from '@kubb/swagger-tanstack-query'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'

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
      query: {
        queryKey: (keys) => ['"v5"', ...keys],
      },
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
          templates: {
            queryKey: queryKey.templates,
          },
        },
      }],
    }),
  ],
}

export default defineConfig(config)
