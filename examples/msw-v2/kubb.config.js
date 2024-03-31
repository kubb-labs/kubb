import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerFaker } from '@kubb/swagger-faker'
import { definePlugin as createSwaggerMsw } from '@kubb/swagger-msw'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'

export default defineConfig(async () => {
  await setTimeout(() => {
    // wait for 1s, async behaviour
    return Promise.resolve(true)
  }, 1000)
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
      createSwagger({ output: false }),
      createSwaggerTS({
        output: {
          path: 'models',
        },
      }),
      createSwaggerFaker({
        output: {
          path: './mocks',
        },
        group: {
          type: 'tag',
          output: './mocks/{{tag}}Mocks',
        },
        seed: [220],
      }),
      createSwaggerMsw({
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
