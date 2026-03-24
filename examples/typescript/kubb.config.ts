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
    plugins: [
      pluginOas({ validate: false, generators: [] }),
      pluginTs({
        output: {
          path: 'models.ts',
          barrelType: false,
        },
        enumType: 'enum',
        syntaxType: 'interface',
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

    plugins: [
      pluginOas({ validate: false, generators: [] }),
      pluginTs({
        output: {
          path: 'models.ts',
          barrelType: false,
        },
        enumType: 'enum',
        syntaxType: 'interface',
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen2', clean: true },
    plugins: [
      pluginOas({ validate: false, generators: [] }),
      pluginTs({
        output: {
          path: 'modelsConst.ts',
          barrelType: false,
        },
        enumType: 'asConst',
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen3', clean: true },
    plugins: [
      pluginOas({ validate: false, generators: [] }),
      pluginTs({
        output: {
          path: 'modelsPascalConst.ts',
          barrelType: false,
        },
        enumType: 'asPascalConst',
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen4', clean: true },
    plugins: [
      pluginOas({ validate: false, generators: [] }),
      pluginTs({
        output: {
          path: 'modelsConstEnum.ts',
          barrelType: false,
        },
        enumType: 'constEnum',
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen5', clean: true },
    plugins: [
      pluginOas({ validate: false, generators: [] }),
      pluginTs({
        output: {
          path: 'modelsLiteral.ts',
          barrelType: false,
        },
        enumType: 'literal',
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
    plugins: [
      pluginOas({ validate: false, generators: [] }),
      pluginTs({
        output: {
          path: 'ts/models',
        },
      }),
    ],
  },
])
