// import '@kubb/react/devtools' // enable/disable devtools

import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginMcp } from '@kubb/plugin-mcp'
import { pluginZod } from '@kubb/plugin-zod'

export default defineConfig(() => {
  return {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    hooks: {
      done: ['npm run typecheck', 'biome format --write ./', 'biome lint --apply-unsafe ./src'],
    },
    output: {
      path: './src/gen',
      clean: true,
      extension: {
        '.ts': '.js',
      },
    },
    plugins: [
      pluginOas({
        validate: false,
      }),
      pluginTs({
        output: { path: 'models/ts' },
      }),
      pluginZod({}),
      pluginMcp({
        client: {
          baseURL: 'https://petstore.swagger.io/v2',
          importPath: '../../client.ts',
        },
      }),
    ],
  }
})
