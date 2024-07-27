import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginClient } from '@kubb/plugin-client'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginMsw } from '@kubb/plugin-msw'
import { pluginSwr } from '@kubb/plugin-swr'
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'
import { pluginTs } from '@kubb/swagger-ts'
import { pluginZod } from '@kubb/swagger-zod'
import { pluginZodios } from '@kubb/swagger-zodios'

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
    pluginOas({
      output: false,
      validate: true,
    }),
    pluginTs({
      output: { path: 'models/ts' },
      group: {
        type: 'tag',
      },
      enumType: 'asPascalConst',
      dateType: 'date',
    }),
    pluginTanstackQuery({
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
    pluginSwr({
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
    pluginClient({
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
    pluginZod({
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
    pluginZodios({
      output: {
        path: 'zodios.ts',
      },
    }),
    pluginFaker({
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
    pluginMsw({
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
