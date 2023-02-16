import { defineConfig } from '@kubb/core'
import createSwagger from '@kubb/swagger'
import createSwaggerTypescript from '@kubb/swagger-typescript'
import createSwaggerReactQuery from '@kubb/swagger-react-query'

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
    hooks: {
      done: 'eslint --fix ./src/gen',
    },
    // logLevel: 'info',
    plugins: [
      createSwagger({ output: false }),
      createSwaggerTypescript({ output: 'models/ts' }),
      createSwaggerReactQuery({ output: './reactQuery', types: { output: 'models' } }),
    ],
  }
})
