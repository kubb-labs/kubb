import { adapterOas } from '@kubb/adapter-oas'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginSwr } from '@kubb/plugin-swr'
import { pluginTs } from '@kubb/plugin-ts'
import { defineConfig } from 'kubb'

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
    adapter: adapterOas({ collisionDetection: false }),
    plugins: [
      pluginOas({ generators: [] }),
      pluginTs({
        output: {
          path: 'models',
          barrelType: 'barrel',
        },
        compatibilityPreset: 'kubbV4',
      }),
      pluginSwr({
        output: {
          path: './hooks',
        },
        mutation: {
          paramsToTrigger: true,
        },
        compatibilityPreset: 'kubbV4',
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
    adapter: adapterOas({ collisionDetection: false }),
    plugins: [
      pluginOas({ generators: [] }),
      pluginTs({
        output: {
          path: 'models',
          barrelType: 'barrel',
        },
        compatibilityPreset: 'kubbV4',
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
        compatibilityPreset: 'kubbV4',
      }),
    ],
  },
])
