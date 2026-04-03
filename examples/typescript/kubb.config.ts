import { adapterOas } from '@kubb/adapter-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { defineConfig } from 'kubb'

const input = { path: './petStore.yaml' } as const

export default defineConfig([
  {
    root: '.',
    input,
    output: {
      path: './src/legacy',
      clean: true,
      format: 'biome',
      lint: 'biome',
    },
    adapter: adapterOas({
      validate: false,
    }),
    plugins: [
      pluginTs({
        output: {
          path: 'models.ts',
          barrelType: false,
        },
        transformer: {
          // Make all properties of the "Pet" schema required
          property(node, { parent }) {
            if (parent?.name === 'Address') {
              return { ...node, required: false }
            }
          },
        },
        enumType: 'enum',
        syntaxType: 'interface',
        compatibilityPreset: 'kubbV4',
      }),
    ],
  },
  {
    root: '.',
    input,
    output: {
      path: './src/gen',
      clean: true,
      format: 'biome',
      lint: 'biome',
    },
    adapter: adapterOas({
      validate: false,
    }),
    plugins: [
      pluginTs({
        output: {
          path: 'models.ts',
          barrelType: false,
        },
        enumType: 'asConst',
        arrayType: 'generic',
        enumKeyCasing: 'screamingSnakeCase',
        syntaxType: 'interface',
        compatibilityPreset: 'kubbV4',
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen2', clean: true, format: 'biome', lint: 'biome' },
    adapter: adapterOas({
      validate: false,
    }),
    plugins: [
      pluginTs({
        output: {
          path: 'modelsConst.ts',
          barrelType: false,
        },
        enumType: 'asConst',
        enumTypeSuffix: 'enumType',
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen3', clean: true, format: 'biome', lint: 'biome' },
    adapter: adapterOas({
      validate: false,
    }),
    plugins: [
      pluginTs({
        output: {
          path: 'modelsPascalConst.ts',
          barrelType: false,
        },
        enumType: 'asPascalConst',
        compatibilityPreset: 'kubbV4',
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen4', clean: true, format: 'biome', lint: 'biome' },
    adapter: adapterOas({
      validate: false,
    }),
    plugins: [
      pluginTs({
        output: {
          path: 'modelsConstEnum.ts',
          barrelType: false,
        },
        enumType: 'constEnum',
        compatibilityPreset: 'kubbV4',
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen5', clean: true, format: 'biome', lint: 'biome' },
    adapter: adapterOas({
      validate: false,
    }),
    plugins: [
      pluginTs({
        output: {
          path: 'modelsLiteral.ts',
          barrelType: false,
        },
        enumType: 'literal',
        compatibilityPreset: 'kubbV4',
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen6', clean: true, format: 'biome', lint: 'biome' },
    hooks: {
      done: ['npm run typecheck'],
    },
    adapter: adapterOas({
      validate: false,
    }),
    plugins: [
      pluginTs({
        output: {
          path: 'ts/models',
        },
        compatibilityPreset: 'kubbV4',
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen7', clean: true, format: 'biome', lint: 'biome' },
    adapter: adapterOas({ validate: false }),
    plugins: [
      pluginTs({
        output: { path: 'modelsInlineLiteral.ts', barrelType: false },
        enumType: 'inlineLiteral',
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen8', clean: true, format: 'biome', lint: 'biome' },
    adapter: adapterOas({ validate: false }),
    plugins: [
      pluginTs({
        output: { path: 'modelsOptionalUndefined.ts', barrelType: false },
        enumType: 'inlineLiteral',
        optionalType: 'undefined',
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen9', clean: true, format: 'biome', lint: 'biome' },
    adapter: adapterOas({ validate: false }),
    plugins: [
      pluginTs({
        output: { path: 'modelsOptionalBoth.ts', barrelType: false },
        enumType: 'inlineLiteral',
        optionalType: 'questionTokenAndUndefined',
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen10', clean: true, format: 'biome', lint: 'biome' },
    adapter: adapterOas({ validate: false }),
    plugins: [
      pluginTs({
        output: { path: 'models' },
        enumType: 'inlineLiteral',
        paramsCasing: 'camelcase',
        group: { type: 'tag' },
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen11', clean: true, format: 'biome', lint: 'biome' },
    adapter: adapterOas({ validate: false }),
    plugins: [
      pluginTs({
        output: { path: 'modelsPascalCaseKeys.ts', barrelType: false },
        enumType: 'asConst',
        enumKeyCasing: 'pascalCase',
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen12', clean: true, format: 'biome', lint: 'biome' },
    hooks: {
      done: ['npm run typecheck'],
    },
    adapter: adapterOas({ validate: false }),
    plugins: [
      pluginTs({
        output: { path: 'modelsCamelCaseKeys.ts', barrelType: false },
        enumType: 'asConst',
        enumKeyCasing: 'camelCase',
      }),
    ],
  },
])
