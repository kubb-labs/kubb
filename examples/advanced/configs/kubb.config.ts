// import '@kubb/react/devtools' // enable/disable devtools

import { defineConfig } from '@kubb/core'
import { pluginClient } from '@kubb/plugin-client'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginMsw } from '@kubb/plugin-msw'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginRedoc } from '@kubb/plugin-redoc'
import { pluginSwr } from '@kubb/plugin-swr'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'

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
    },
    hooks: {
      done: ['npm run typecheck', 'biome format --write ./', 'biome lint --apply-unsafe ./src'],
    },
    plugins: [
      pluginOas({ validate: true }),
      pluginOas({
        output: {
          path: 'schemas2',
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
        dateType: 'date',
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
                key(key) {
                  return key
                },
                importPath: '@tanstack/react-query',
                methods: ['post', 'put', 'delete'],
              },
            },
          },
        ],
        group: { type: 'tag' },
        client: {
          dataReturnType: 'full',
          importPath: '../../../../tanstack-query-client.ts',
        },
        query: {
          importPath: '../../../../tanstack-query-hook.ts',
        },
        infinite: false,
        suspense: false,

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
          importPath: '../../../../swr-client.ts',
          dataReturnType: 'data',
        },
        parser: 'zod',
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
        group: { type: 'tag', output: './clients/axios/{{tag}}Service' },
        importPath: '../../../../axios-client.ts',
        operations: true,
        dataReturnType: 'full',
        pathParamsType: 'object',
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
        operations: false,
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
        dateType: 'date',
        mapper: {
          status: `faker.helpers.arrayElement(['working', 'idle']) as any`,
        },
        transformers: {
          name(name, type) {
            return `${name}Faker`
          },
        },
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
