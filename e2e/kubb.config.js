import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginClient } from '@kubb/plugin-client'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginMsw } from '@kubb/plugin-msw'
import { pluginSwr } from '@kubb/plugin-swr'
import { pluginTanstackQuery } from '@kubb/plugin-tanstack-query'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'

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
    pluginOas({
      output: false,
      validate: true,
      docs: false,
    }),
    pluginOas({
      output: {
        path: 'schemas2',
      },
      validate: true,
    }),
    pluginTs({
      output: {
        path: 'models/ts',
        exportType: false,
      },
      group: {
        type: 'tag',
      },
      enumType: 'asPascalConst',
    }),
    pluginTanstackQuery({
      output: {
        path: './clients/hooks',
      },
      group: { type: 'tag' },
      mutate: {
        variablesType: 'mutate',
        methods: ['post', 'put', 'delete'],
      },
    }),
    pluginSwr({
      output: {
        path: './clients/swr',
      },
      group: { type: 'tag' },
    }),
    pluginClient({
      output: {
        path: './clients/axios',
      },
      group: { type: 'tag', output: './clients/axios/{{tag}}Service' },
    }),
    pluginZod({
      output: {
        path: './zod',
      },
      group: { type: 'tag' },
      typed: false,
      typedSchema: true,
    }),
    pluginFaker({
      output: {
        path: 'mocks',
      },
      group: { type: 'tag' },
    }),
    pluginMsw({
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
