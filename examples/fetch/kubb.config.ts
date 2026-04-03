import { adapterOas } from '@kubb/adapter-oas'
import { pluginClient } from '@kubb/plugin-client'
import { pluginTs } from '@kubb/plugin-ts'

import { defineConfig } from 'kubb'

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
    adapter: adapterOas({ serverIndex: 0 }),
    plugins: [
      pluginTs({
        output: { path: 'models.ts' },
        compatibilityPreset: 'kubbV4',
      }),
      pluginClient({
        output: {
          path: '.',
        },
        client: 'fetch',
        compatibilityPreset: 'kubbV4',
      }),
    ],
  }
})
