import { adapterOas } from '@kubb/adapter-oas'
import { defineConfig } from '@kubb/core'
import { pluginClient } from '@kubb/plugin-client'
import { pluginOas } from '@kubb/plugin-oas'
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
      path: './src/gen',
      clean: true,
    },
    hooks: {
      // done: ['npm run typecheck', 'biome format --write ./', 'biome lint --fix --unsafe ./src'],
    },
    adapter: adapterOas({ collisionDetection: false }),
    plugins: [
      pluginOas({ generators: [] }),
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
        mapper: {
          productName: 'z.string().uuid()',
        },
        importPath: '../../zod.ts',
        inferred: true,
        compatibilityPreset: 'kubbV4',
      }),
      pluginClient({
        output: {
          path: './zodClients.ts',
          barrelType: false,
        },
        include: [
          {
            type: 'tag',
            pattern: 'store',
          },
        ],
        parser: 'zod',
        dataReturnType: 'data',
        pathParamsType: 'object',
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
      path: './src/gen2',
      clean: true,
    },
    plugins: [
      pluginOas({ generators: [] }),
      pluginZod({
        output: {
          path: './zod',
        },
        mini: true,
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
    plugins: [
      pluginOas({ generators: [] }),
      pluginZod({
        output: {
          path: './zod',
        },
        compatibilityPreset: 'kubbV4',
      }),
    ],
  },
])
