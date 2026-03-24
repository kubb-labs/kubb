import { adapterOas } from '@kubb/adapter-oas'
import { defineConfig } from '@kubb/core'
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
  // { name: 'test', path: './schemas/test.json' },
  // OpenAPI 3.1
  { name: 'train-travel', path: './schemas/train-travel.yaml' },
  { name: 'Figma', path: 'https://raw.githubusercontent.com/figma/rest-api-spec/refs/heads/main/openapi/openapi.yaml' },
  { name: 'spotify', path: 'https://raw.githubusercontent.com/sonallux/spotify-web-api/refs/heads/main/official-spotify-open-api.yml', strict: false },
  // OpenAPI 3.0
  { name: 'discriminator', path: './schemas/discriminator.yaml' },
  // { name: 'bunq.com', path: './schemas/bunq.com.json', strict: false },  // TS2300: duplicate barrel exports in hook index files
  { name: 'atlassian.com', path: 'https://developer.atlassian.com/cloud/jira/platform/swagger-v3.v3.json', strict: false },
  { name: 'optionalParameters', path: './schemas/optionalParameters.json' },
  { name: 'allOf', path: './schemas/allOf.json' },
  { name: 'anyOf', path: './schemas/anyOf.json' },
  { name: 'petStoreContent', path: './schemas/petStoreContent.json' },
  { name: 'twitter', path: './schemas/twitter.json' },
  { name: 'jokesOne', path: './schemas/jokesOne.yaml' },
  { name: 'readme.io', path: './schemas/readme.io.yaml' },
  { name: 'worldtime', path: './schemas/worldtime.yaml' },
  { name: 'zalando', path: './schemas/zalando.yaml' },
  { name: 'requestBody', path: './schemas/requestBody.yaml' },
  { name: 'box', path: './schemas/box.json' },
  { name: 'enums', path: './schemas/enums.yaml' },
  { name: 'dataset_api', path: './schemas/dataset_api.yaml' },
  { name: 'petStoreV3', path: 'https://petstore3.swagger.io/api/v3/openapi.json' },
  { name: 'stripe', path: 'https://raw.githubusercontent.com/stripe/openapi/master/openapi/spec3.json', strict: false, typecheck: false }, // RangeError: Maximum call stack size exceeded — deeply recursive types overflow tsc
  // { name: 'openai', path: 'https://app.stainless.com/api/spec/documented/openai/openapi.documented.yml', strict: false }, // generates zod schemas biome cannot parse (format hook error is swallowed, CI appears green despite failures)
  { name: 'vercel', path: 'https://openapi.vercel.sh/', strict: false },
]

/** @type {import('@kubb/core').UserConfig} */
const baseConfig = {
  root: '.',
  input: {
    path: 'https://petstore3.swagger.io/api/v3/openapi.json',
  },
  output: {
    path: './gen',
    clean: true,
    lint: 'auto',
    format: 'auto',
  },
  adapter: adapterOas(),
  plugins: [
    pluginOas({
      generators: [],
      validate: false,
      docs: false,
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
      compatibilityPreset: 'kubbV4',
    }),
    pluginReactQuery({
      output: {
        path: './clients/hooks',
      },
      group: { type: 'tag' },
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
      version: '3',
    }),
    pluginFaker({
      output: {
        path: 'mocks',
        barrelType: false,
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
  return schemas.map(({ name, path, strict, typecheck = true }) => {
    return {
      ...baseConfig,
      name,
      input: {
        path,
      },
      hooks: {
        done: typecheck ? [strict ? 'npm run typecheck -- --strict' : 'npm run typecheck'] : [],
      },
    }
  })
})
