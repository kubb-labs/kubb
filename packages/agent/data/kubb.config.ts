import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  root: '.',
  input: {
    path: './openapi.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
    write: false,
  },
  plugins: [
    pluginOas(),
    pluginTs({
      output: {
        path: 'models',
      },
    }),
  ],
})
