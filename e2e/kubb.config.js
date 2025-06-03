// import '@kubb/react/devtools' // enable/disable devtools

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

const schemas = [
  { name: 'test', path: './schemas/test.json' },
  // { name: 'Machines API', path: 'https://docs.machines.dev/spec/openapi3.json' },
  // { name: 'discriminator', path: './schemas/discriminator.yaml' },
  // { name: 'bunq.com', path: './schemas/bunq.com.json', strict: false },
  // { name: 'petStoreV3', path: 'https://petstore3.swagger.io/api/v3/openapi.json' },
  // { name: 'optionalParameters', path: './schemas/optionalParameters.json' },
  // { name: 'allOf', path: './schemas/allOf.json' },
  // { name: 'anyOf', path: './schemas/anyOf.json' },
  // { name: 'petStoreContent', path: './schemas/petStoreContent.json' },
  // { name: 'twitter', path: './schemas/twitter.json' },
  // { name: 'twitter2', path: './schemas/twitter2.json' },
  // { name: 'jokesOne', path: './schemas/jokesOne.yaml' },
  // { name: 'readme.io', path: './schemas/readme.io.yaml' },
  // { name: 'worldtime', path: './schemas/worldtime.yaml' },
  // { name: 'zalando', path: './schemas/zalando.yaml' },
  // { name: 'requestBody', path: './schemas/requestBody.yaml' },
  // { name: 'box', path: './schemas/box.json' },
  // { name: 'digitalocean', path: './schemas/digitalocean.yaml' },
  // { name: 'enums', path: './schemas/enums.yaml' },
  // { name: 'dataset_api', path: './schemas/dataset_api.yaml' },
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
  plugins: [
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
}

/**
 * @link https://apis.guru/
 */

export default defineConfig(() => {
  return schemas.map(({ name, path, strict }) => {
    return {
      ...baseConfig,
      name,
      input: {
        path,
      },
      hooks: {
        done: [strict ? 'npm run typecheck -- --strict' : 'npm run typecheck', 'biome format --write ./', 'biome lint --fix --unsafe ./src'],
      },
    }
  })
})
