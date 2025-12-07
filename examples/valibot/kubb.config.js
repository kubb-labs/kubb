import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginValibot } from '@kubb/plugin-valibot'

export default defineConfig({
  name: 'valibot',
  root: '.',
  input: {
    path: './petStore.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
  },
  plugins: [
    pluginOas({ generators: [] }),
    pluginTs({
      output: {
        path: './ts',
      },
    }),
    pluginValibot({
      output: {
        path: './valibot',
      },
      inferred: true,
    }),
  ],
})
