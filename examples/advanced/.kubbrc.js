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
  plugins: [
    createSwagger({
      output: false,
      validate: true,
    }),
    createSwaggerTS({
      output: { path: 'models/ts' },
      group: {
        type: 'tag',
      },
      enumType: 'asPascalConst',
      dateType: 'date',
    }),
    createSwaggerTanstackQuery({
      output: {
        path: './clients/hooks',
      },
      exclude: [
        {
          type: 'tag',
          pattern: 'store',
        },
      ],
      group: { type: 'tag' },
      infinite: {},
    }),
    createSwaggerSWR({
      output: {
        path: './clients/swr',
      },
      exclude: [
        {
          type: 'tag',
          pattern: 'store',
        },
      ],
      group: { type: 'tag' },
    }),
    createSwaggerClient({
      output: {
        path: './clients/axios',
      },
      exclude: [
        {
          type: 'tag',
          pattern: 'store',
        },
      ],
      group: { type: 'tag', output: './clients/axios/{{tag}}Service' },
    }),
    createSwaggerZod({
      output: {
        path: './zod',
      },
      exclude: [
        {
          type: 'tag',
          pattern: 'store',
        },
      ],
      group: { type: 'tag' },
    }),
    createSwaggerZodios({
      output: 'zodios.ts',
    }),
    createSwaggerFaker({
      output: {
        path: 'mocks',
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
})
