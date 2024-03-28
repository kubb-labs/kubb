import { defineConfig } from '@kubb/core'
import { definePlugin as swagger } from '@kubb/swagger'
import { definePlugin as swaggerClient } from '@kubb/swagger-client'
import { definePlugin as swaggerFaker } from '@kubb/swagger-faker'
import { definePlugin as swaggerMsw } from '@kubb/swagger-msw'
import { definePlugin as swaggerSwr } from '@kubb/swagger-swr'
import { definePlugin as swaggerTanstackQuery } from '@kubb/swagger-tanstack-query'
import { definePlugin as swaggerTS } from '@kubb/swagger-ts'
import { definePlugin as swaggerZod } from '@kubb/swagger-zod'
import { definePlugin as swaggerZodios } from '@kubb/swagger-zodios'

export default defineConfig(async () => {
  await setTimeout(() => {
    // wait for 1s, async behaviour
    return Promise.resolve(true)
  }, 1000)
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
    plugins: [
      swagger({
        output: {
          path: 'schemas',
        },
        validate: true,
      }),
      swagger({
        output: {
          path: 'schemas2',
        },
        validate: true,
      }),
      swaggerTS({
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
      swaggerTanstackQuery({
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
        infinite: {},
        dataReturnType: 'full',
        parser: 'zod',
      }),
      swaggerSwr({
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
      }),
      swaggerClient({
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
      swaggerZod({
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
        dateType: 'date',
        typed: true,
      }),
      swaggerZodios({
        output: {
          path: 'zodios.ts',
          exportAs: 'zodios',
        },
      }),
      swaggerFaker({
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
      }),
      swaggerMsw({
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
