import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerTS } from '@kubb/swagger-ts'
import { definePlugin as createSwaggerZod } from '@kubb/swagger-zod'

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
          path: './ts',
        },
      }),
      createSwaggerZod({
        output: {
          path: './zod',
        },
      }),
    ],
  }
})
