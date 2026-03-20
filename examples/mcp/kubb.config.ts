import { adapterOas } from '@kubb/adapter-oas'
import { defineConfig } from '@kubb/core'
import { pluginMcp } from '@kubb/plugin-mcp'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
// import { openDevtools } from '@kubb/react-fabric'

export default defineConfig(() => {
  // openDevtools()

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
      extension: {
        '.ts': '.js',
      },
    },
    adapter: adapterOas({ collisionDetection: false }),
    plugins: [
      pluginOas({
        validate: false,
        generators: [],
      }),
      pluginTs({
        output: { path: 'models/ts' },
        legacy: true,
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
