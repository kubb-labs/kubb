import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginClient } from '@kubb/plugin-client'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { customQueryOptionsGenerator } from './src/generators/customQueryOptionsGenerator'

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
    done: ['npm run typecheck'],
  },
  plugins: [
    // Core plugin for parsing OpenAPI
    pluginOas({ output: false }),

    // Generate TypeScript types
    pluginTs({
      output: {
        path: './types',
      },
    }),

    // Generate Zod schemas (optional, for runtime validation)
    pluginZod({
      output: {
        path: './zod',
      },
    }),

    // Generate API client functions
    pluginClient({
      output: {
        path: './clients',
      },
    }),

    // Generate default React Query hooks
    pluginReactQuery({
      output: {
        path: './hooks',
      },
      client: {
        dataReturnType: 'full', // Can be 'data' or 'full'
      },
      infinite: {
        queryParam: 'page',
        initialPageParam: 0,
      },
      parser: 'zod', // Enable Zod parsing
    }),

    // Add custom generator for query options with performance timing
    pluginOas({
      output: {
        path: './hooks',
      },
      generators: [customQueryOptionsGenerator],
    }),
  ],
})
