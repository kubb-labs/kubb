import { adapterOas } from '@kubb/adapter-oas'
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginSwr } from '@kubb/plugin-swr'
import { pluginTs } from '@kubb/plugin-ts'

const input = { path: './petStore.yaml' }

export default defineConfig([
  {
    root: '.',
    input,
    output: {
      path: './src/gen',
      clean: true,
      barrelType: 'barrel',
    },
    adapter: adapterOas({ legacy: true }),
    plugins: [
      pluginOas({ generators: [] }),
      pluginTs({
        output: {
          path: 'models',
          barrelType: 'barrel',
        },
        legacy: true,
      }),
      pluginSwr({
        output: {
          path: './hooks',
        },
        mutation: {
          paramsToTrigger: true,
        },
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen2', clean: true },
    hooks: {
      done: ['npm run typecheck', 'biome format --write ./', 'biome lint --fix --unsafe ./src'],
    },
    adapter: adapterOas({ legacy: true }),
    plugins: [
      pluginOas({ generators: [] }),
      pluginTs({
        output: {
          path: 'models',
          barrelType: 'barrel',
        },
        legacy: true,
      }),
      pluginSwr({
        output: {
          path: './swr-deprecated.ts',
          barrelType: false,
        },
        paramsToTrigger: true,
        include: [
          {
            type: 'operationId',
            pattern: 'updatePetWithForm',
          },
        ],
        query: false,
      }),
    ],
  },
])
