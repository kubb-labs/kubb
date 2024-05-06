import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerClient } from '@kubb/swagger-client'
import { definePlugin as createSwaggerFaker } from '@kubb/swagger-faker'
import { definePlugin as createSwaggerMsw } from '@kubb/swagger-msw'
import { definePlugin as createSwaggerSwr } from '@kubb/swagger-swr'
import { definePlugin as createSwaggerTanstackQuery } from '@kubb/swagger-tanstack-query'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'
import { definePlugin as createSwaggerZod } from '@kubb/swagger-zod'
import { definePlugin as createSwaggerZodios } from '@kubb/swagger-zodios'

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
    plugins: [
      createSwagger({
        output: {
          path: 'schemas',
        },
        validate: true,
      }),
      createSwagger({
        output: {
          path: 'schemas2',
        },
        validate: true,
      }),
      createSwaggerTS({
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
      createSwaggerTanstackQuery({
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
      createSwaggerSwr({
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
      createSwaggerClient({
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
      createSwaggerZod({
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
      createSwaggerZodios({
        output: {
          path: 'zodios.ts',
          exportAs: 'zodios',
        },
      }),
      createSwaggerFaker({
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
      createSwaggerMsw({
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
