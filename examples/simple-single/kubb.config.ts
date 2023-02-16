import { defineConfig } from '@kubb/core'
import createSwagger from '@kubb/swagger'
import createSwaggerTypescript from '@kubb/swagger-typescript'
import createSwaggerReactQuery from '@kubb/swagger-react-query'

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
  plugins: [createSwagger({}), createSwaggerTypescript({ output: 'models.ts' }), createSwaggerReactQuery({ output: './hooks' })],
})
