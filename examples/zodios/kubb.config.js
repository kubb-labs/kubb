import { defineConfig } from '@kubb/core'

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
      [
        '@kubb/swagger',
        {
          output: false,
        },
      ],
      [
        '@kubb/swagger-zod',
        {
          output: {
            path: './zod',
          },
        },
      ],
      [
        '@kubb/swagger-zodios',
        {
          output: {
            path: './zodios.ts',
          },
        },
      ],
    ],
  }
})
