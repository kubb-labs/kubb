import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginSwr } from '@kubb/plugin-swr'
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
    pluginOas({ output: false }),
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
