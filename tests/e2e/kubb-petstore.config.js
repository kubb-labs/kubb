import { defineConfig } from '@kubb/core'
import { camelCase } from '@kubb/core/transformers'
import { pluginClient } from '@kubb/plugin-client'
import { pluginCypress } from '@kubb/plugin-cypress'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginMsw } from '@kubb/plugin-msw'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginSwr } from '@kubb/plugin-swr'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'

export default defineConfig(() => {
  return {
    root: '.',
    input: {
      path: 'https://petstore3.swagger.io/api/v3/openapi.json',
    },
    output: {
      path: './src/gen',
      clean: true,
      format: 'biome',
      lint: 'biome',
    },
    plugins: [
      pluginTs({
        output: {
          path: './types.ts',
        },
      }),
      pluginOas({
        generators: [],
        validate: false,
        docs: false,
      }),
      pluginOas({
        output: {
          path: 'schemas2',
        },
        validate: false,
      }),
      pluginTs({
        output: {
          path: 'models/ts',
          barrelType: false,
        },
        group: {
          type: 'tag',
        },
        enumType: 'asConst',
      }),
      pluginReactQuery({
        output: {
          path: './clients/hooks',
        },
        group: { type: 'tag' },
        mutation: {
          methods: ['post', 'put', 'delete'],
        },
      }),
      pluginSwr({
        output: {
          path: './clients/swr',
          barrelType: false,
        },
        group: { type: 'tag' },
      }),
      pluginClient({
        output: {
          path: './clients/axios',
        },
        group: {
          type: 'tag',
          name({ group }) {
            return `${group}Service`
          },
        },
      }),
      pluginCypress({
        output: {
          path: './clients/cypress',
          barrelType: false,
        },
        group: {
          type: 'tag',
          name({ group }) {
            return `${group}Requests`
          },
        },
      }),
      pluginZod({
        output: {
          path: './zod',
          barrelType: false,
        },
        group: { type: 'tag' },
        inferred: true,
        typed: false,
        operations: false,
        version: '3',
      }),
      pluginFaker({
        output: {
          path: 'mocks',
          barrelType: false,
        },
        group: { type: 'tag' },
        transformers: {
          name: (name, type) => {
            if (type === 'file' || type === 'function') {
              return camelCase(name, {
                prefix: type ? 'createMock' : undefined,
                isFile: type === 'file',
              })
            }
            return name
          },
        },
      }),
      pluginMsw({
        output: {
          path: 'msw',
        },
        group: { type: 'tag' },
      }),
    ],
    hooks: {
      done: ['npm run typecheck'],
    },
  }
})
