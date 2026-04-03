import { adapterOas } from '@kubb/adapter-oas'
import { defineConfig } from '@kubb/core'
import { parserTs } from '@kubb/parser-ts'
import { pluginClient } from '@kubb/plugin-client'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig(() => {
  return {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    hooks: {
      done: ['npm run typecheck', 'biome format --write ./', 'biome lint --fix --unsafe ./src'],
    },
    output: {
      path: './src/gen',
      clean: true,
    },
    parsers: [parserTs],
    adapter: adapterOas({ serverIndex: 0 }),
    plugins: [
      pluginOas({
        validate: false,
        generators: [],
        serverIndex: 0,
      }),
      pluginTs({
        output: { path: 'models.ts' },
        compatibilityPreset: 'kubbV4',
      }),
      pluginClient({
        output: {
          path: '.',
        },
        client: 'fetch',
      }),
    ],
  }
})
