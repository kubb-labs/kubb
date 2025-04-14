//import '@kubb/react/devtools' // enable/disable devtools
// can devtools and ui work together, default port for devtools are 8097

import { defineConfig } from '@kubb/core'
import { pluginClient } from '@kubb/plugin-client'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginCypress } from '@kubb/plugin-cypress'
import { pluginMsw } from '@kubb/plugin-msw'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginRedoc } from '@kubb/plugin-redoc'
import { pluginSwr } from '@kubb/plugin-swr'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { pluginMcp } from '@kubb/plugin-mcp'

export default defineConfig(() => {
  return {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src/gen',
      clean: true,
      barrelType: 'named',
      defaultBanner: false,
    },
    hooks: {
      done: ['npm run typecheck', 'biome format --write ./', 'biome lint --apply-unsafe ./src'],
    },
    plugins: [
      pluginOas({
        validate: true,
      }),
      pluginOas({
        output: {
          path: 'schemas2',
        },
        group: {
          type: 'tag',
        },
        validate: false,
      }),
      pluginRedoc(),
      pluginTs({
        output: {
          path: 'models/ts',
        },
        group: {
          type: 'tag',
        },
        enumType: 'asConst',
        enumSuffix: 'enum',
        dateType: 'string',
        override: [
          {
            type: 'operationId',
            pattern: 'findPetsByStatus',
            options: {
              enumType: 'enum',
            },
          },
        ],
      }),
      pluginReactQuery({
        output: {
          path: './clients/hooks',
        },
        exclude: [
          {
            type: 'tag',
            pattern: 'store',
          },
        ],
        override: [
          {
            type: 'operationId',
            pattern: 'findPetsByTags',
            options: {
              infinite: {
                queryParam: 'pageSize',
                initialPageParam: 0,
              },
              mutation: {
                importPath: '@tanstack/react-query',
                methods: ['post', 'put', 'delete'],
              },
            },
          },
        ],
        group: { type: 'tag' },
        client: {
          dataReturnType: 'full',
          importPath: '../../../../axios-client.ts',
        },
        query: {
          importPath: '../../../../tanstack-query-hook',
        },
        infinite: false,
        suspense: false,
        paramsType: 'object',
        parser: 'zod',
      }),
      pluginSwr({
        output: {
          path: './clients/swr',
        },
        exclude: [
          {
            type: 'tag',
            pattern: 'store',
          },
        ],
        group: { type: 'tag' },
        client: {
          importPath: '../../../../axios-client.ts',
          dataReturnType: 'full',
          baseURL: 'https://petstore3.swagger.io/api/v3',
        },
        paramsType: 'object',
        pathParamsType: 'object',
        transformers: {
          name(name, type) {
            return `${name}SWR`
          },
        },
      }),
      pluginClient({
        output: {
          path: './clients/axios',
        },
        exclude: [
          {
            type: 'tag',
            pattern: 'store',
          },
        ],
        parser: 'zod',
        group: { type: 'tag', name: ({ group }) => `${group}Service` },
        importPath: '../../../../axios-client.ts',
        operations: true,
        baseURL: 'https://petstore3.swagger.io/api/v3',
        dataReturnType: 'full',
        paramsType: 'object',
        pathParamsType: 'object',
        override: [
          {
            type: 'contentType',
            pattern: 'multipart/form-data',
            options: {
              parser: 'client',
            },
          },
        ],
      }),
      pluginZod({
        output: {
          path: './zod',
        },
        exclude: [
          {
            type: 'tag',
            pattern: 'store',
          },
        ],
        group: { type: 'tag' },
        dateType: 'stringOffset',
        inferred: true,
        // typed: true,
        operations: false,
      }),
      pluginMcp({
        output: {
          path: './mcp',
          barrelType: false,
        },
        exclude: [
          {
            type: 'tag',
            pattern: 'store',
          },
        ],
        group: { type: 'tag' },
        client: {
          baseURL: 'https://petstore.swagger.io/v2',
        },
      }),
      pluginFaker({
        output: {
          path: 'mocks',
        },
        exclude: [
          {
            type: 'tag',
            pattern: 'store',
          },
        ],
        group: { type: 'tag' },
        mapper: {
          status: `faker.helpers.arrayElement(['working', 'idle']) as any`,
        },
        transformers: {
          name(name, type) {
            return `${name}Faker`
          },
        },
      }),
      pluginCypress({
        output: {
          path: 'cypress',
          barrelType: false,
        },
        group: { type: 'tag' },
      }),
      pluginMsw({
        output: {
          path: 'msw',
        },
        handlers: true,
        exclude: [
          {
            type: 'tag',
            pattern: 'store',
          },
        ],
        group: { type: 'tag' },
      }),
    ],
  }
})
