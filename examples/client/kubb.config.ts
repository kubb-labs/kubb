import { defineConfig } from '@kubb/core'
import { pluginClient } from '@kubb/plugin-client'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { clientOperationGenerator } from './src/generators/clientOperationGenerator'
import { clientOperationReactGenerator } from './src/generators/clientOperationReactGenerator'
import { clientStaticGenerator } from './src/generators/clientStaticGenerator'

const camelCase = (str: string) =>
  str
    .split(/[\s_-]+/)
    .map((w, i) => (i === 0 ? w.charAt(0).toLowerCase() + w.slice(1) : w.charAt(0).toUpperCase() + w.slice(1)))
    .join('')

const input = { path: './petStore.yaml' } as const

const tsPlugin = pluginTs({
  output: { path: 'models/ts' },
  group: { type: 'tag' },
  enumType: 'asConst',
  dateType: 'date',
})

export default defineConfig([
  {
    root: '.',
    input,
    output: {
      path: './src/gen',
      clean: true,
      extension: {
        '.ts': '.js',
      },
    },
    plugins: [
      pluginOas({ validate: false, generators: [] }),
      tsPlugin,
      pluginClient({
        output: {
          path: './clients/axios',
          barrelType: 'propagate',
          banner: '/* eslint-disable no-alert, no-console */',
        },
        client: 'fetch',
        exclude: [{ type: 'tag', pattern: 'store' }],
        group: {
          type: 'tag',
          name({ group }) {
            return `${group}Service`
          },
        },
        operations: true,
        pathParamsType: 'object',
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen2' },
    plugins: [
      pluginOas({ validate: false, generators: [] }),
      tsPlugin,
      pluginClient({
        output: {
          path: './clients/axios/xml',
          barrelType: 'propagate',
          banner: '/* eslint-disable no-alert, no-console */',
        },
        contentType: 'application/xml',
        include: [{ type: 'operationId', pattern: 'uploadFile' }],
        transformers: {
          name(name, type) {
            if (type === 'function') {
              return `${name}XML`
            }
            return name
          },
        },
        pathParamsType: 'object',
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen3', clean: true },
    plugins: [
      pluginOas({ validate: false, generators: [] }),
      tsPlugin,
      pluginClient({
        output: { path: './tagObject.ts' },
        generators: [clientStaticGenerator],
        include: [{ type: 'tag', pattern: 'store' }],
        group: {
          type: 'tag',
          name({ group }) {
            return `${group}Controller`
          },
        },
        dataReturnType: 'full',
        pathParamsType: 'object',
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen4', clean: true },
    plugins: [
      pluginOas({ validate: false, generators: [] }),
      pluginClient({
        output: { path: './tagClientOperation.ts' },
        generators: [clientOperationGenerator],
        include: [{ type: 'tag', pattern: 'store' }],
        dataReturnType: 'full',
        pathParamsType: 'object',
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen5', clean: true },
    plugins: [
      pluginOas({ validate: false, generators: [] }),
      pluginClient({
        output: { path: './tagClientOperationReact.ts' },
        generators: [clientOperationReactGenerator],
        include: [{ type: 'tag', pattern: 'store' }],
        dataReturnType: 'full',
        pathParamsType: 'object',
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen6', clean: true },
    plugins: [
      pluginOas({ validate: false, generators: [] }),
      tsPlugin,
      pluginClient({
        output: { path: './tag.ts' },
        parser: 'client',
        include: [{ type: 'tag', pattern: 'store' }],
        group: {
          type: 'tag',
          name({ group }) {
            return `${group}Controller`
          },
        },
        transformers: {
          name(name, type) {
            if (type === 'function') {
              return camelCase(`${name} controller`)
            }
            return name
          },
        },
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen7', clean: true },
    hooks: {
      done: ['npm run typecheck', 'biome format --write ./', 'biome lint --fix --unsafe ./src'],
    },
    plugins: [
      pluginOas({ validate: false, generators: [] }),
      tsPlugin,
      pluginClient({
        output: {
          path: './clients/class',
          barrelType: false,
          banner: '/* eslint-disable no-alert, no-console */',
        },
        client: 'fetch',
        clientType: 'class',
        group: { type: 'tag' },
        pathParamsType: 'object',
      }),
    ],
  },
])
