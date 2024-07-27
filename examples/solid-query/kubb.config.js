import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'
import { pluginTs } from '@kubb/plugin-ts'

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
    }),
    pluginTs({
      output: { path: 'models' },
    }),
    pluginTanstackQuery({
      output: {
        path: './hooks',
      },
      framework: 'solid',
    }),
  ],
})
