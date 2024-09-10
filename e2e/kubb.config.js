// import '@kubb/react/devtools' // enable/disable devtools

import { defineConfig } from '@kubb/core'
import { pluginClient } from '@kubb/plugin-client'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginMsw } from '@kubb/plugin-msw'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginSwr } from '@kubb/plugin-swr'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'

const schemas = [
  // ['test', './schemas/test.json'],
  ['petStoreV3', 'https://petstore3.swagger.io/api/v3/openapi.json'],
  // ['Machines API', 'https://docs.machines.dev/spec/openapi3.json'], // not valid anymore
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
  ['dataset_api', './schemas/dataset_api.yaml'],
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
    done: ['npm run typecheck', 'biome format --write ./', 'biome lint --apply-unsafe ./src'],
  },
  plugins: [
    pluginOas({
      output: false,
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
        exportType: false,
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
        exportType: false,
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
        exportType: false,
      },
      group: { type: 'tag' },
      inferred: true,
      typed: false,
      operations: false,
    }),
    pluginFaker({
      output: {
        path: 'mocks',
        exportType: false,
      },
      group: { type: 'tag' },
      // transformers: {
      //   name: (name, type) => {
      //     if (type === 'file' || type === 'function') {
      //       return camelCase(name, {
      //         prefix: type ? 'createMock' : undefined,
      //         isFile: type === 'file',
      //       })
      //     }
      //     return name
      //   },
      // },
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
