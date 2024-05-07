import { defineConfig } from '@kubb/core'
import { pluginSwagger } from '@kubb/swagger'
import { pluginFaker } from '@kubb/swagger-faker'
import { pluginMsw } from '@kubb/swagger-msw'
import { pluginTs } from '@kubb/swagger-ts'

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
    plugins: [
      pluginSwagger({ output: false }),
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
        group: {
          type: 'tag',
          output: './msw/{{tag}}Handlers',
        },
      }),
    ],
  }
})
