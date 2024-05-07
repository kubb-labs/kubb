import { defineConfig } from '@kubb/core'
import { pluginSwagger } from '@kubb/swagger'
import { pluginZod } from '@kubb/swagger-zod'
import { pluginZodios } from '@kubb/swagger-zodios'

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
      pluginZod({
        output: {
          path: './zod',
        },
      }),
      pluginZodios({
        output: {
          path: './zodios.ts',
        },
      }),
    ],
  }
})
