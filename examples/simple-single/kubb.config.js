import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginRedoc } from '@kubb/plugin-redoc'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'

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
      barrelType: 'all',
      extension: {
        '.ts': '',
      },
      format: 'auto',
      lint: 'auto',
    },
    hooks: {
      done: ['npm run typecheck'],
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
      pluginReactQuery({
        output: {
          path: './hooks.ts',
        },
      }),
      pluginZod({
        output: {
          path: './zod.ts',
        },
        operations: false,
      }),
    ],
  },
])
