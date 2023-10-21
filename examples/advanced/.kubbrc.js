import { defineConfig } from '@kubb/core'
import createSwagger from '@kubb/swagger'
import createSwaggerClient from '@kubb/swagger-client'
import createSwaggerFaker from '@kubb/swagger-faker'
import createSwaggerMsw from '@kubb/swagger-msw'
import createSwaggerSWR from '@kubb/swagger-swr'
import createSwaggerTanstackQuery from '@kubb/swagger-tanstack-query'
import createSwaggerTS from '@kubb/swagger-ts'
import createSwaggerZod from '@kubb/swagger-zod'
import createSwaggerZodios from '@kubb/swagger-zodios'

export default defineConfig({
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
  hooks: {
    // done: ['prettier --write "**/*.{ts,tsx}"', 'eslint --fix ./src/gen'],
  },
  plugins: [
    createSwagger({ output: false, validate: true }),
    createSwaggerTS({
      output: 'models/ts',
      groupBy: {
        type: 'tag',
      },
      enumType: 'asPascalConst',
      dateType: 'date',
    }),
    createSwaggerTanstackQuery({
      output: './clients/hooks',
      skipBy: [
        {
          type: 'tag',
          pattern: 'store',
        },
      ],
      groupBy: { type: 'tag' },
      client: './src/client.ts',
      infinite: {},
    }),
    createSwaggerSWR({
      output: './clients/swr',
      skipBy: [
        {
          type: 'tag',
          pattern: 'store',
        },
      ],
      groupBy: { type: 'tag' },
      client: './src/client.ts',
    }),
    createSwaggerClient({
      output: './clients/axios',
      skipBy: [
        {
          type: 'tag',
          pattern: 'store',
        },
      ],
      groupBy: { type: 'tag', output: './clients/axios/{{tag}}Service' },
      client: './src/client.ts',
    }),
    createSwaggerZod({
      output: './zod',
      skipBy: [
        {
          type: 'tag',
          pattern: 'store',
        },
      ],
      groupBy: { type: 'tag' },
    }),
    createSwaggerZodios({
      output: 'zodios.ts',
    }),
    createSwaggerFaker({
      output: 'mocks',
      skipBy: [
        {
          type: 'tag',
          pattern: 'store',
        },
      ],
      groupBy: { type: 'tag' },
      dateType: 'date',
    }),
    createSwaggerMsw({
      output: 'msw',
      skipBy: [
        {
          type: 'tag',
          pattern: 'store',
        },
      ],
      groupBy: { type: 'tag' },
    }),
  ],
})
