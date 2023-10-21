import { defineConfig } from '@kubb/core'
import createSwagger from '@kubb/swagger'
import createSwaggerTanstackQuery from '@kubb/swagger-tanstack-query'
import createSwaggerTS from '@kubb/swagger-ts'

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
    done: ['prettier --write "**/*.{ts,tsx}"', 'eslint --fix ./src/gen'],
  },
  plugins: [createSwagger({ output: false }), createSwaggerTS({ output: 'models' }), createSwaggerTanstackQuery({ output: './hooks', framework: 'solid' })],
})
