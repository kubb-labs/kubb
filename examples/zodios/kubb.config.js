import { defineConfig } from '@kubb/core'
import { definePlugin as createSwagger } from '@kubb/swagger'
import { definePlugin as createSwaggerZod } from '@kubb/swagger-zod'
import { definePlugin as createSwaggerZodios } from '@kubb/swagger-zodios'

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
      createSwagger({ output: false }),
      createSwaggerZod({
        output: {
          path: './zod',
        },
      }),
      createSwaggerZodios({
        output: {
          path: './zodios.ts',
        },
      }),
    ],
  }
})
