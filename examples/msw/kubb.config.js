import { defineConfig } from '@kubb/core'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginMsw } from '@kubb/plugin-msw'
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
      pluginOas({ output: false }),
      pluginTs({
        output: {
          path: 'models',
        },
      }),
      pluginFaker({
        output: {
          path: './mocks',
        },
        group: {
          type: 'tag',
          output: './mocks/{{tag}}Mocks',
        },
        seed: [220],
      }),
      pluginMsw({
        output: {
          path: './msw',
        },
        handlers: true,
        group: {
          type: 'tag',
          output: './msw/{{tag}}Handlers',
        },
      }),
    ],
  }
})
