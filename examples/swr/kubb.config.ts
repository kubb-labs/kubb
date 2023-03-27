import { defineConfig } from '@kubb/core'
import createSwagger from '@kubb/swagger'
import createSwaggerTS from '@kubb/swagger-ts'
import createSwaggerSWR from '@kubb/swagger-swr'

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
  plugins: [createSwagger({ output: false }), createSwaggerTS({ output: 'models' }), createSwaggerSWR({ output: './hooks' })],
})
