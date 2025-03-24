import { defineConfig } from '@kubb/core'
import { pluginCypress } from '@kubb/plugin-cypress'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig(() => {
  return {
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
      pluginOas({ generators: [] }),
      pluginTs({
        output: {
          path: 'models',
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
  }
})
