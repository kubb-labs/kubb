import { defineConfig } from '@kubb/core'
import { pluginSwagger } from '@kubb/swagger'
import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'
import { pluginTs } from '@kubb/swagger-ts'

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
    pluginSwagger({
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
