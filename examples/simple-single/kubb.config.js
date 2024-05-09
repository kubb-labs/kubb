import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'
import { pluginTs } from '@kubb/swagger-ts'
import { pluginZod } from '@kubb/swagger-zod'
import { pluginRedoc } from '@kubb/plugin-redoc'

export default defineConfig([
  {
    name: 'petStore',
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src/gen',
      clean: true,
    },
    plugins: [
      pluginOas({
        validate: true,
      }),
      pluginRedoc({
        output: {
          path: './docs/index.html',
        },
      }),
      pluginTs({
        output: { path: 'models.ts' },
      }),
      pluginTanstackQuery({
        output: {
          path: './hooks.ts',
        },
      }),
      pluginZod({
        output: {
          path: './zod.ts',
        },
        templates: {
          operations: false,
        },
      }),
    ],
  },
  {
    name: 'openapi3',
    root: '.',
    input: {
      path: 'https://docs.machines.dev/spec/openapi3.json',
    },
    output: {
      path: './src/gen2',
      clean: true,
    },
    plugins: [
      pluginOas({ validate: false, output: false }),
      pluginZod({
        output: {
          // exportType: false,
          path: 'index.ts',
        },
      }),
    ],
  },
])
