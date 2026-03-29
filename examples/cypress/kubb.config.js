import { adapterOas } from '@kubb/adapter-oas'
import { defineConfig } from '@kubb/core'
import { pluginCypress } from '@kubb/plugin-cypress'
import { pluginTs } from '@kubb/plugin-ts'

const input = { path: './petStore.yaml' }
const adapter = adapterOas({})

export default defineConfig([
  {
    root: '.',
    input,
    output: {
      path: './src/gen',
      clean: true,
    },
    adapter,
    plugins: [
      pluginTs({
        output: {
          path: 'models.ts',
        },
      }),
      pluginCypress({
        output: {
          path: 'cypress',
        },
        group: {
          type: 'tag',
          name({ group }) {
            return `${group}Requests`
          },
        },
        baseURL: 'http://localhost:3000',
      }),
    ],
  },
  {
    root: '.',
    input,
    output: { path: './src/gen-v4', clean: true },
    adapter,
    plugins: [
      pluginTs({
        output: { path: 'models.ts' },
        compatibilityPreset: 'kubbV4',
      }),
      pluginCypress({
        output: { path: 'cypress' },
        baseURL: 'http://localhost:3000',
        compatibilityPreset: 'kubbV4',
      }),
    ],
  },
])
