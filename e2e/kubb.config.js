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

const schemas = [
  ['petStoreV3', 'https://petstore3.swagger.io/api/v3/openapi.json'],
  ['optionalParameters', './schemas/optionalParameters.json'],
  ['allOf', './schemas/allOf.json'],
  ['anyOf', './schemas/anyOf.json'],
  ['petStoreContent', './schemas/petStoreContent.json'],
  ['twitter', './schemas/twitter.json'],
  ['twitter2', './schemas/twitter2.json'],
  ['bunq.com', './schemas/bunq.com.json'],
  ['jokesOne', './schemas/jokesOne.yaml'],
  ['readme.io', './schemas/readme.io.yaml'],
  ['worldtime', './schemas/worldtime.yaml'],
  ['zalando', './schemas/zalando.yaml'],
  ['requestBody', './schemas/requestBody.yaml'],
  ['box', './schemas/box.json'],
  ['digitalocean', './schemas/digitalocean.yaml'],
  ['enums', './schemas/enums.yaml'],
]

/** @type {import('@kubb/core').UserConfig} */
const baseConfig = {
  root: '.',
  input: {
    path: 'https://petstore3.swagger.io/api/v3/openapi.json',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
  hooks: {
    done: ['pnpm typecheck'],
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
      dateType: 'date',
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

/**
 * @link https://apis.guru/
 */

export default defineConfig(() => {
  return schemas.map(([name, path]) => {
    return {
      ...baseConfig,
      name,
      input: {
        path,
      },
    }
  })
})
