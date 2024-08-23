import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginZod } from '@kubb/plugin-zod'
import { pluginZodios } from '@kubb/plugin-zodios'

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
      pluginOas({ output: false }),
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
