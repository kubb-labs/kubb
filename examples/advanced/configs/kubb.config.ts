import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginClient } from '@kubb/plugin-client'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginMsw } from '@kubb/plugin-msw'
import { pluginSwr } from '@kubb/plugin-swr'
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'
import { pluginTs } from '@kubb/swagger-ts'
import { pluginZod } from '@kubb/swagger-zod'
import { pluginZodios } from '@kubb/swagger-zodios'

export default defineConfig(() => {
  return {
    root: '.',
    input: {
      // path: './test.json',
      path: './petStore.yaml',
    },
    output: {
      path: './src/gen',
      clean: true,
    },
    hooks: {
      done: ['npm run typecheck'],
    },
    plugins: [
      pluginOas({ validate: false }),
      pluginOas({
        output: {
          path: 'schemas2',
        },
        validate: false,
      }),
      pluginTs({
        output: {
          path: 'models/ts',
          extName: '.js',
        },
        group: {
          type: 'tag',
        },
        enumType: 'asPascalConst',
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
      pluginTanstackQuery({
        output: {
          path: './clients/hooks',
          exportAs: 'hooks',
        },
        exclude: [
          {
            type: 'tag',
            pattern: 'store',
          },
        ],
        override: [
          {
            type: 'tag',
            pattern: 'pet',
            options: {
              infinite: {
                queryParam: 'test',
                initialPageParam: '0',
              },
              mutate: {
                methods: ['post', 'put', 'delete'],
                variablesType: 'mutate',
              },
            },
          },
        ],
        group: { type: 'tag' },
        client: {
          importPath: '../../../../tanstack-query-client.ts',
        },
        query: {
          importPath: '../../../../tanstack-query-hook.ts',
        },
        infinite: {},
        dataReturnType: 'full',
        parser: 'zod',
      }),
      pluginSwr({
        output: {
          path: './clients/swr',
          exportAs: 'swrHooks',
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
        },
        dataReturnType: 'full',
        parser: 'zod',
      }),
      pluginClient({
        output: {
          path: './clients/axios',
          exportAs: 'clients',
        },
        exclude: [
          {
            type: 'tag',
            pattern: 'store',
          },
        ],
        group: { type: 'tag', output: './clients/axios/{{tag}}Service' },
        client: {
          importPath: '../../../../axios-client.ts',
        },
        dataReturnType: 'full',
        pathParamsType: 'object',
      }),
      pluginZod({
        output: {
          path: './zod',
          exportAs: 'zod',
        },
        exclude: [
          {
            type: 'tag',
            pattern: 'store',
          },
        ],
        group: { type: 'tag' },
        dateType: 'stringOffset',
        typed: true,
      }),
      pluginZodios({
        output: {
          path: 'zodios.ts',
          exportAs: 'zodios',
        },
      }),
      pluginFaker({
        output: {
          path: 'mocks',
          exportAs: 'faker',
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
      }),
      pluginMsw({
        output: {
          path: 'msw',
          exportAs: 'msw',
        },
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
