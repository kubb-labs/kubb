import { defineConfig } from '@kubb/core'

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

/** @type {import('@kubb/core').KubbUserConfig} */
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
    ['@kubb/swagger', {
      output: false,
      validate: true,
    }],
    [
      '@kubb/swagger-ts',
      {
        output: {
          path: 'models/ts',
          exportType: false,
        },
        group: {
          type: 'tag',
        },
        enumType: 'asPascalConst',
      },
    ],
    ['@kubb/swagger-tanstack-query', {
      output: {
        path: './clients/hooks',
      },
      group: { type: 'tag' },
    }],
    ['@kubb/swagger-swr', {
      output: {
        path: './clients/swr',
      },
      group: { type: 'tag' },
    }],
    ['@kubb/swagger-client', {
      output: {
        path: './clients/axios',
      },
      group: { type: 'tag', output: './clients/axios/{{tag}}Service' },
    }],
    ['@kubb/swagger-zod', {
      output: {
        path: './zod',
      },
      group: { type: 'tag' },
    }],
    ['@kubb/swagger-zodios', { output: { path: 'zodios.ts' } }],
    ['@kubb/swagger-faker', {
      output: {
        path: 'mocks',
      },
      group: { type: 'tag' },
    }],
    ['@kubb/swagger-msw', {
      output: {
        path: 'msw',
      },
      group: { type: 'tag' },
    }],
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
