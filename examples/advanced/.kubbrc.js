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
    createSwaggerSwr({
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
      output: {
        path: 'zodios.ts',
      },
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
