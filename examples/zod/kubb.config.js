import { adapterOas } from '@kubb/adapter-oas'
import { defineConfig } from '@kubb/core'
import { parserTs } from '@kubb/parser-ts'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'

export default defineConfig([
  {
    name: 'zod',
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src/zod',
      clean: true,
    },
    hooks: {
      // done: ['npm run typecheck', 'biome format --write ./', 'biome lint --fix --unsafe ./src'],
    },
    parsers: [parserTs],
    adapter: adapterOas({}),
    plugins: [
      pluginTs({
        output: {
          path: './ts',
        },
        compatibilityPreset: 'kubbV4',
      }),
      pluginZod({
        output: {
          path: './zod',
        },
        operations: true,
        importPath: '../../zod.ts',
        inferred: true,
        compatibilityPreset: 'kubbV4',
      }),
    ],
  },
  {
    name: 'zod-mini',
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src/mini',
      clean: true,
    },
    parsers: [parserTs],
    adapter: adapterOas({}),
    plugins: [
      pluginZod({
        output: {
          path: './zod',
        },
        mini: true,
        compatibilityPreset: 'kubbV4',
      }),
    ],
  },
  {
    name: 'zod-union',
    root: '.',
    input: {
      path: './unionWithReadOnly.yaml',
    },
    output: {
      path: './src/gen3',
      clean: true,
    },
    parsers: [parserTs],
    adapter: adapterOas({}),
    plugins: [
      pluginZod({
        output: {
          path: './zod',
        },
        compatibilityPreset: 'kubbV4',
      }),
    ],
  },
])
