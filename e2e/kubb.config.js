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
  ['Machines API', 'https://docs.machines.dev/spec/openapi3.json'],
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
      output: false,
      validate: true,
      docs: false,
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
        exportType: false,
      },
      group: {
        type: 'tag',
      },
      enumType: 'asPascalConst',
    }),
    createSwaggerTanstackQuery({
      output: {
        path: './clients/hooks',
      },
      group: { type: 'tag' },
      mutate: {
        variablesType: 'mutate',
        methods: ['post', 'put', 'delete'],
      },
    }),
    createSwaggerSwr({
      output: {
        path: './clients/swr',
      },
      group: { type: 'tag' },
    }),
    createSwaggerClient({
      output: {
        path: './clients/axios',
      },
      group: { type: 'tag', output: './clients/axios/{{tag}}Service' },
    }),
    createSwaggerZod({
      output: {
        path: './zod',
      },
      group: { type: 'tag' },
    }),
    createSwaggerZodios({
      output: {
        path: 'zodios.ts',
      },
    }),
    createSwaggerFaker({
      output: {
        path: 'mocks',
      },
      group: { type: 'tag' },
    }),
    createSwaggerMsw({
      output: {
        path: 'msw',
      },
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
