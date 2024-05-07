import { defineConfig } from '@kubb/core'
import { pluginSwagger } from '@kubb/swagger'
import { pluginSwr } from '@kubb/swagger-swr'
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
    pluginSwagger({ output: false }),
    pluginTs({
      output: {
        path: 'models',
      },
    }),
    pluginSwr({
      output: {
        path: './hooks',
      },
    }),
  ],
})
