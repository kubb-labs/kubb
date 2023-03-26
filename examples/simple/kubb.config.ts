import { defineConfig } from '@kubb/core'
import createSwagger from '@kubb/swagger'
import createSwaggerTS from '@kubb/swagger-ts'
import createSwaggerTanstackQuery from '@kubb/swagger-tanstack-query'

export default defineConfig({
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
  logLevel: 'warn',
  plugins: [createSwagger({}), createSwaggerTS({ output: 'models' }), createSwaggerTanstackQuery({ output: './hooks' })],
})
