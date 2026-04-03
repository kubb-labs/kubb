import { pluginMcp } from '@kubb/plugin-mcp'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { defineConfig } from 'kubb'
// import { openDevtools } from '@kubb/react-fabric'

export default defineConfig(() => {
  // openDevtools()

  return {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    hooks: {
      done: ['npm run typecheck', 'biome format --write ./', 'biome check --fix --unsafe ./src'],
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
        generators: [],
      }),
      pluginTs({
        output: { path: 'models/ts' },
        compatibilityPreset: 'kubbV4',
      }),
      pluginZod({
        compatibilityPreset: 'kubbV4',
      }),
      pluginMcp({
        compatibilityPreset: 'kubbV4',
        client: {
          baseURL: 'https://petstore.swagger.io/v2',
          importPath: '../../client.ts',
        },
      }),
    ],
  }
})
