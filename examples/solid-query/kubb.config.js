import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTanstackQuery } from '@kubb/plugin-tanstack-query'
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
  hooks: {
    done: ['npm run typecheck', 'biome format --write ./', 'biome lint --apply-unsafe ./src'],
  },
  plugins: [
    pluginOas({
      output: false,
    }),
    pluginTs({
      output: { path: 'models', exportType: false },
    }),
    pluginTanstackQuery({
      output: {
        path: './hooks',
        exportType: false,
      },
      framework: 'solid',
    }),
  ],
})
