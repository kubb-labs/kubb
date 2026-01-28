import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginOrpc } from '@kubb/plugin-orpc'
import { pluginZod } from '@kubb/plugin-zod'

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
    done: ['npm run typecheck', 'biome format --write ./', 'biome lint --fix --unsafe ./src'],
  },
  plugins: [
    pluginOas({ validate: false, generators: [] }),
    pluginZod({
      output: {
        path: 'zod',
      },
    }),
    pluginOrpc({
      output: {
        path: 'orpc',
      },
      router: true,
      routerName: 'petStoreContract',
    }),
  ],
})
