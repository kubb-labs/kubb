import { adapterOas } from '@kubb/adapter-oas'
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'

const input = { path: './petStore.yaml' } as const

export default defineConfig([
  {
    root: '.',
    input,
    output: {
      path: './src/legacy',
      clean: true,
    },
    adapter: adapterOas({
      validate: false,
      collisionDetection: false,
    }),
    plugins: [
      pluginOas({ validate: false, generators: [] }),
      pluginTs({
        output: {
          path: 'models.ts',
          barrelType: false,
        },
        transformers: [
          {
            // Make all properties of the "Pet" schema required
            property(node, { parent }) {
              if (parent?.name === 'Address') {
                return { ...node, required: false }
              }
            },
          },
        ],
        enumType: 'enum',
        syntaxType: 'interface',
        legacy: true,
      }),
    ],
  },
  {
    root: '.',
    input,
    output: {
      path: './src/gen',
      clean: true,
    },
    adapter: adapterOas({
      validate: false,
      collisionDetection: false,
    }),
    plugins: [
      pluginOas({ validate: false, generators: [] }),
      pluginTs({
        output: {
          path: 'models.ts',
          barrelType: false,
        },
        enumType: 'enum',
        syntaxType: 'interface',
        legacy: true,
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen2', clean: true },
    adapter: adapterOas({
      validate: false,
      collisionDetection: false,
    }),
    plugins: [
      pluginOas({ validate: false, generators: [] }),
      pluginTs({
        output: {
          path: 'modelsConst.ts',
          barrelType: false,
        },
        enumType: 'asConst',
        legacy: true,
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen3', clean: true },
    adapter: adapterOas({
      validate: false,
      collisionDetection: false,
    }),
    plugins: [
      pluginOas({ validate: false, generators: [] }),
      pluginTs({
        output: {
          path: 'modelsPascalConst.ts',
          barrelType: false,
        },
        enumType: 'asPascalConst',
        legacy: true,
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen4', clean: true },
    adapter: adapterOas({
      validate: false,
      collisionDetection: false,
    }),
    plugins: [
      pluginOas({ validate: false, generators: [] }),
      pluginTs({
        output: {
          path: 'modelsConstEnum.ts',
          barrelType: false,
        },
        enumType: 'constEnum',
        legacy: true,
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen5', clean: true },
    adapter: adapterOas({
      validate: false,
      collisionDetection: false,
    }),
    plugins: [
      pluginOas({ validate: false, generators: [] }),
      pluginTs({
        output: {
          path: 'modelsLiteral.ts',
          barrelType: false,
        },
        enumType: 'literal',
        legacy: true,
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen6', clean: true },
    hooks: {
      done: ['npm run typecheck', 'biome format --write ./', 'biome lint --fix --unsafe ./src'],
    },
    adapter: adapterOas({
      validate: false,
      collisionDetection: false,
    }),
    plugins: [
      pluginOas({ validate: false, generators: [] }),
      pluginTs({
        output: {
          path: 'ts/models',
        },
        legacy: true,
      }),
    ],
  },
])
