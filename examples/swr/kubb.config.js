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
    barrelType: 'barrel',
  },
  hooks: {
    done: ['npm run typecheck', 'biome format --write ./', 'biome lint --fix --unsafe ./src'],
  },
  plugins: [
    pluginOas({ generators: [] }),
    pluginTs({
      output: {
        path: 'models',
        barrelType: 'barrel',
      },
    }),
    pluginSwr({
      output: {
        path: './hooks',
      },
    }),
  ],
})
