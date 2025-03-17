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
    },
    hooks: {
      done: ['npm run typecheck', 'biome format --write ./', 'biome lint --apply-unsafe ./src'],
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
  {
    name: 'test',
    root: '.',
    input: {
      path: 'https://raw.githubusercontent.com/burt202/kubb-test/refs/heads/master/docs/main.yml',
    },
    output: {
      path: 'src/gen3/',
      barrelType: 'all',
      clean: true,
    },
    plugins: [
      pluginOas({
        generators: [],
      }),
      pluginTs({
        output: {
          path: './types.ts',
          barrelType: 'propagate',
        },
        enumSuffix: '',
      }),
    ],
    hooks: {
      done: ['npm run typecheck', 'biome format --write ./', 'biome lint --apply-unsafe ./src'],
    },
  },
  {
    name: 'openapi3',
    root: '.',
    input: {
      path: 'https://docs.machines.dev/spec/openapi3.json',
    },
    output: {
      path: './src/gen2',
      barrelType: false,
      clean: true,
    },
    plugins: [
      pluginOas({ validate: false, generators: [] }),
      pluginZod({
        output: {
          path: 'index.ts',
          barrelType: false,
        },
        operations: false,
      }),
    ],
  },
])
