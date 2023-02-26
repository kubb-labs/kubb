import { defineConfig } from '@kubb/core'

export default defineConfig(async () => {
  await setTimeout(() => {
    // wait for 1s, async behaviour
    return Promise.resolve(true)
  }, 1000)
  return {
    root: '.',
    input: {
      // path: './test.json',
      path: './petStore.yaml',
    },
    output: {
      path: './src/gen',
      clean: true,
    },
    hooks: {
      done: 'eslint --fix ./src/gen',
    },
    // logLevel: 'info',
    plugins: [
      ['@kubb/swagger', { output: false }],
      ['@kubb/swagger-ts', { output: 'models/ts' }],
      ['@kubb/swagger-react-query', { output: './reactQuery', groupBy: 'tag' }],
      ['@kubb/swagger-zod', { output: './zod' }],
      // createSwagger({ output: false }),
      // createSwaggerTS({ output: 'models/ts' }),
      // createSwaggerReactQuery({ output: './reactQuery' }),
    ],
  }
})
